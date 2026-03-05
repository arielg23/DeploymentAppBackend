import re
import uuid
from datetime import datetime

from asyncpg import UniqueViolationError
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from models.assignment import Assignment, AssignmentStatus
from models.technician import Technician

DEVEUI_RE = re.compile(r"^[0-9A-Fa-f]{16}$")


def normalize_deveui(raw: str) -> str:
    return raw.upper().replace(":", "").replace("-", "").replace(" ", "")


async def process_assignment(
    db: AsyncSession,
    upload_id: uuid.UUID,
    site_id: str,
    unit_id: str,
    dev_eui_raw: str,
    technician_id: uuid.UUID,
    timestamp_local: datetime,
) -> Assignment:
    dev_eui_normalized = normalize_deveui(dev_eui_raw)
    if not DEVEUI_RE.match(dev_eui_normalized):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid DevEUI format")

    assignment = Assignment(
        upload_id=upload_id,
        site_id=site_id,
        unit_id=unit_id,
        dev_eui_raw=dev_eui_raw,
        dev_eui_normalized=dev_eui_normalized,
        technician_id=technician_id,
        timestamp_local=timestamp_local,
        status=AssignmentStatus.SENT,
    )
    db.add(assignment)
    try:
        await db.flush()
        await db.commit()
        await db.refresh(assignment)
        return assignment
    except IntegrityError as e:
        await db.rollback()
        orig = getattr(e, "orig", None)
        # Determine which constraint was violated
        constraint_name = ""
        if orig:
            constraint_name = getattr(orig, "constraint_name", "") or str(orig)

        if "uq_deveui_per_upload" in constraint_name:
            conflict_type = "dev_eui"
            existing = await _get_existing_by_deveui(db, dev_eui_normalized, upload_id)
        else:
            conflict_type = "unit"
            existing = await _get_existing_by_unit(db, site_id, unit_id, upload_id)

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "conflict_type": conflict_type,
                "existing": {
                    "assignment_id": str(existing.id),
                    "site_id": existing.site_id,
                    "unit_id": existing.unit_id,
                    "dev_eui_normalized": existing.dev_eui_normalized,
                    "technician_email": existing.technician.email,
                    "timestamp_local": existing.timestamp_local.isoformat(),
                    "timestamp_server": existing.timestamp_server.isoformat(),
                },
            },
        )


async def _get_existing_by_deveui(db: AsyncSession, dev_eui_normalized: str, upload_id: uuid.UUID) -> Assignment:
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(Assignment)
        .options(selectinload(Assignment.technician))
        .where(Assignment.dev_eui_normalized == dev_eui_normalized, Assignment.upload_id == upload_id)
    )
    return result.scalar_one()


async def _get_existing_by_unit(db: AsyncSession, site_id: str, unit_id: str, upload_id: uuid.UUID) -> Assignment:
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(Assignment)
        .options(selectinload(Assignment.technician))
        .where(
            Assignment.site_id == site_id,
            Assignment.unit_id == unit_id,
            Assignment.upload_id == upload_id,
        )
    )
    return result.scalar_one()

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.dependencies import get_current_technician
from models.assignment import Assignment, AssignmentStatus
from models.technician import Technician
from models.unit import Unit
from schemas.assignment import ValidationRequest, ValidationResponse
from services.assignment_service import normalize_deveui

router = APIRouter(prefix="/validation", tags=["validation"])


@router.post("", response_model=ValidationResponse)
async def validate(
    body: ValidationRequest,
    technician: Technician = Depends(get_current_technician),
    db: AsyncSession = Depends(get_db),
):
    normalized = normalize_deveui(body.dev_eui_normalized)

    result = await db.execute(
        select(Assignment)
        .options(selectinload(Assignment.technician))
        .where(
            Assignment.site_id == body.site_id,
            Assignment.dev_eui_normalized == normalized,
            Assignment.status == AssignmentStatus.SENT,
        )
        .order_by(Assignment.timestamp_server.desc())
        .limit(1)
    )
    assignment = result.scalar_one_or_none()
    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No assignment found for this DevEUI")

    # Fetch unit name
    unit_result = await db.execute(
        select(Unit).where(Unit.upload_id == assignment.upload_id, Unit.unit_id == assignment.unit_id)
    )
    unit = unit_result.scalar_one_or_none()

    return ValidationResponse(
        unit_id=assignment.unit_id,
        unit_name=unit.unit_name if unit else assignment.unit_id,
        site_id=assignment.site_id,
        dev_eui_normalized=assignment.dev_eui_normalized,
        technician_email=assignment.technician.email,
        timestamp_local=assignment.timestamp_local,
    )


@router.get("/skip-reasons-public", tags=["skip-reasons"])
async def get_skip_reasons(
    technician: Technician = Depends(get_current_technician),
    db: AsyncSession = Depends(get_db),
):
    from models.skip_reason import SkipReason
    result = await db.execute(
        select(SkipReason).where(SkipReason.active == True).order_by(SkipReason.label)
    )
    reasons = result.scalars().all()
    return [{"id": str(r.id), "label": r.label, "active": r.active} for r in reasons]

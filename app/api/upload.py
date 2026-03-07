import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.dependencies import get_current_technician, verify_site_access
from models.assignment import Assignment, AssignmentStatus
from models.skip import Skip
from models.skip_reason import SkipReason
from models.technician import Technician
from models.unit import Unit
from models.upload import Upload
from schemas.assignment import AssignRequest, AssignResponse, SkipRequest, SkipResponse
from schemas.upload import UnitResponse
from services.assignment_service import process_assignment
from services.export_service import generate_csv

router = APIRouter(prefix="/upload", tags=["upload"])


async def _get_upload_or_404(db: AsyncSession, upload_id: uuid.UUID) -> Upload:
    result = await db.execute(select(Upload).where(Upload.upload_id == upload_id))
    upload = result.scalar_one_or_none()
    if not upload:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Upload not found")
    return upload


@router.get("/{upload_id}/units", response_model=list[UnitResponse])
async def get_units(
    upload_id: uuid.UUID,
    technician: Technician = Depends(get_current_technician),
    db: AsyncSession = Depends(get_db),
):
    upload = await _get_upload_or_404(db, upload_id)
    await verify_site_access(upload.site_id, technician, db)

    units_result = await db.execute(
        select(Unit).where(Unit.upload_id == upload_id).order_by(Unit.sequence)
    )
    units = units_result.scalars().all()

    # Fetch assignments for this upload
    assign_result = await db.execute(
        select(Assignment).where(Assignment.upload_id == upload_id)
    )
    assignments_by_unit = {a.unit_id: a for a in assign_result.scalars().all()}

    # Fetch skips
    skip_result = await db.execute(
        select(Skip).where(Skip.upload_id == upload_id)
    )
    skipped_units = {s.unit_id for s in skip_result.scalars().all()}

    response = []
    for u in units:
        a = assignments_by_unit.get(u.unit_id)
        response.append(UnitResponse(
            upload_id=u.upload_id,
            unit_id=u.unit_id,
            site_id=u.site_id,
            unit_name=u.unit_name,
            sequence=u.sequence,
            customer_name=u.customer_name,
            customer_id=u.customer_id,
            barcode=u.barcode,
            assignment_status=a.status.value if a else None,
            dev_eui_normalized=a.dev_eui_normalized if a else None,
            is_skipped=u.unit_id in skipped_units,
        ))
    return response


@router.post("/{upload_id}/assign", response_model=AssignResponse)
async def assign_lock(
    upload_id: uuid.UUID,
    body: AssignRequest,
    technician: Technician = Depends(get_current_technician),
    db: AsyncSession = Depends(get_db),
):
    upload = await _get_upload_or_404(db, upload_id)
    await verify_site_access(upload.site_id, technician, db)

    assignment = await process_assignment(
        db=db,
        upload_id=upload_id,
        site_id=body.site_id,
        unit_id=body.unit_id,
        dev_eui_raw=body.dev_eui_raw,
        technician_id=technician.id,
        timestamp_local=body.timestamp_local,
    )
    return AssignResponse(assignment_id=assignment.id, status=assignment.status.value)


@router.post("/{upload_id}/skip", response_model=SkipResponse)
async def skip_unit(
    upload_id: uuid.UUID,
    body: SkipRequest,
    technician: Technician = Depends(get_current_technician),
    db: AsyncSession = Depends(get_db),
):
    upload = await _get_upload_or_404(db, upload_id)
    await verify_site_access(upload.site_id, technician, db)

    if body.reason_id:
        reason_result = await db.execute(
            select(SkipReason).where(SkipReason.id == body.reason_id, SkipReason.active == True)
        )
        if not reason_result.scalar_one_or_none():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skip reason not found")

    skip = Skip(
        upload_id=upload_id,
        site_id=body.site_id,
        unit_id=body.unit_id,
        technician_id=technician.id,
        reason_id=body.reason_id,
        timestamp=body.timestamp or datetime.now(timezone.utc),
    )
    db.add(skip)
    await db.commit()
    await db.refresh(skip)
    return SkipResponse(skip_id=skip.id)


@router.get("/{upload_id}/export")
async def export_csv(
    upload_id: uuid.UUID,
    technician: Technician = Depends(get_current_technician),
    db: AsyncSession = Depends(get_db),
):
    upload = await _get_upload_or_404(db, upload_id)
    await verify_site_access(upload.site_id, technician, db)

    csv_content = await generate_csv(db, upload_id)
    return StreamingResponse(
        iter([csv_content]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=upload_{upload_id}.csv"},
    )


@router.get("/{upload_id}/barcode/{barcode_value}", response_model=UnitResponse)
async def lookup_by_barcode(
    upload_id: uuid.UUID,
    barcode_value: str,
    technician: Technician = Depends(get_current_technician),
    db: AsyncSession = Depends(get_db),
):
    upload = await _get_upload_or_404(db, upload_id)
    await verify_site_access(upload.site_id, technician, db)

    result = await db.execute(
        select(Unit).where(Unit.upload_id == upload_id, Unit.barcode == barcode_value)
    )
    unit = result.scalar_one_or_none()
    if not unit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Barcode not found in this upload")

    assign_result = await db.execute(
        select(Assignment).where(Assignment.upload_id == upload_id, Assignment.unit_id == unit.unit_id)
    )
    a = assign_result.scalar_one_or_none()

    skip_result = await db.execute(
        select(Skip).where(Skip.upload_id == upload_id, Skip.unit_id == unit.unit_id)
    )
    is_skipped = skip_result.scalar_one_or_none() is not None

    return UnitResponse(
        upload_id=unit.upload_id,
        unit_id=unit.unit_id,
        site_id=unit.site_id,
        unit_name=unit.unit_name,
        sequence=unit.sequence,
        customer_name=unit.customer_name,
        customer_id=unit.customer_id,
        barcode=unit.barcode,
        assignment_status=a.status.value if a else None,
        dev_eui_normalized=a.dev_eui_normalized if a else None,
        is_skipped=is_skipped,
    )

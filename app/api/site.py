from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.dependencies import get_current_technician, verify_site_access
from models.site import Site
from models.technician import Technician
from models.upload import Upload
from schemas.site import ActiveUploadResponse

router = APIRouter(prefix="/site", tags=["site"])


@router.get("/{site_id}/active-upload", response_model=ActiveUploadResponse)
async def get_active_upload(
    site_id: str,
    technician: Technician = Depends(get_current_technician),
    db: AsyncSession = Depends(get_db),
):
    await verify_site_access(site_id, technician, db)

    result = await db.execute(select(Site).where(Site.site_id == site_id))
    site = result.scalar_one_or_none()
    if not site or not site.active_upload_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No active upload for this site")

    result = await db.execute(select(Upload).where(Upload.upload_id == site.active_upload_id))
    upload = result.scalar_one_or_none()
    if not upload:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Upload not found")

    return ActiveUploadResponse(
        upload_id=upload.upload_id,
        site_id=upload.site_id,
        status=upload.status.value,
        uploaded_at=upload.uploaded_at.isoformat(),
    )

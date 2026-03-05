import uuid
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.site import Site
from models.upload import Upload, UploadStatus


async def activate_upload(db: AsyncSession, upload_id: uuid.UUID) -> Upload:
    result = await db.execute(select(Upload).where(Upload.upload_id == upload_id))
    upload = result.scalar_one_or_none()
    if not upload:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Upload not found")
    if upload.status == UploadStatus.ACTIVE:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Upload already active")
    if upload.status == UploadStatus.COMPLETE:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot activate a completed upload")

    # Deactivate any other active upload for this site (should not exist due to DB constraint, but be safe)
    site_result = await db.execute(select(Site).where(Site.site_id == upload.site_id))
    site = site_result.scalar_one()

    upload.status = UploadStatus.ACTIVE
    site.active_upload_id = upload.upload_id
    await db.commit()
    await db.refresh(upload)
    return upload


async def complete_upload(db: AsyncSession, upload_id: uuid.UUID) -> Upload:
    result = await db.execute(select(Upload).where(Upload.upload_id == upload_id))
    upload = result.scalar_one_or_none()
    if not upload:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Upload not found")
    if upload.status != UploadStatus.ACTIVE:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only ACTIVE uploads can be marked complete")

    site_result = await db.execute(select(Site).where(Site.site_id == upload.site_id))
    site = site_result.scalar_one()

    upload.status = UploadStatus.COMPLETE
    site.active_upload_id = None
    await db.commit()
    await db.refresh(upload)
    return upload

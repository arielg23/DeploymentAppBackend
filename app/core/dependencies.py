from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.security import decode_access_token

bearer_scheme = HTTPBearer()


async def get_current_technician(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
):
    from models.technician import Technician

    try:
        technician_id = decode_access_token(credentials.credentials)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

    result = await db.execute(select(Technician).where(Technician.id == technician_id, Technician.active == True))
    technician = result.scalar_one_or_none()
    if not technician:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Technician not found or inactive")
    return technician


async def verify_site_access(site_id: str, technician, db: AsyncSession) -> None:
    from models.technician import TechnicianSiteAccess

    result = await db.execute(
        select(TechnicianSiteAccess).where(
            TechnicianSiteAccess.technician_id == technician.id,
            TechnicianSiteAccess.site_id == site_id,
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No access to this site")

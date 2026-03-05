from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.dependencies import get_current_technician
from models.site import Site
from models.technician import Technician, TechnicianSiteAccess
from schemas.site import SiteResponse

router = APIRouter(prefix="/technician", tags=["technician"])


@router.get("/sites", response_model=list[SiteResponse])
async def get_my_sites(
    technician: Technician = Depends(get_current_technician),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Site)
        .join(TechnicianSiteAccess, TechnicianSiteAccess.site_id == Site.site_id)
        .where(TechnicianSiteAccess.technician_id == technician.id)
        .order_by(Site.site_name)
    )
    return result.scalars().all()

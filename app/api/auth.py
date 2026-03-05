from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.security import create_access_token, create_refresh_token, decode_refresh_token, verify_password
from models.technician import Technician
from schemas.auth import AccessTokenResponse, LoginRequest, RefreshRequest, TokenResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Technician).where(Technician.email == body.email, Technician.active == True))
    technician = result.scalar_one_or_none()
    if not technician or not verify_password(body.password, technician.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    return TokenResponse(
        access_token=create_access_token(str(technician.id)),
        refresh_token=create_refresh_token(str(technician.id)),
        technician_id=str(technician.id),
        email=technician.email,
    )


@router.post("/refresh", response_model=AccessTokenResponse)
async def refresh(body: RefreshRequest, db: AsyncSession = Depends(get_db)):
    try:
        technician_id = decode_refresh_token(body.refresh_token)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    result = await db.execute(select(Technician).where(Technician.id == technician_id, Technician.active == True))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Technician not found")

    return AccessTokenResponse(access_token=create_access_token(technician_id))

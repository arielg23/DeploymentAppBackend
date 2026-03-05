import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.database import Base


class Technician(Base):
    __tablename__ = "technicians"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    site_access: Mapped[list["TechnicianSiteAccess"]] = relationship(back_populates="technician")


class TechnicianSiteAccess(Base):
    __tablename__ = "technician_site_access"

    technician_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("technicians.id", ondelete="CASCADE"), primary_key=True
    )
    site_id: Mapped[str] = mapped_column(
        String, ForeignKey("sites.site_id", ondelete="CASCADE"), primary_key=True
    )

    technician: Mapped["Technician"] = relationship(back_populates="site_access")
    site: Mapped["Site"] = relationship(back_populates="technician_access")


from models.site import Site  # noqa: E402, F401

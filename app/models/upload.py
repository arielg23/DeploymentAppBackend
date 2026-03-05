import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.database import Base


class UploadStatus(str, enum.Enum):
    INACTIVE = "INACTIVE"
    ACTIVE = "ACTIVE"
    COMPLETE = "COMPLETE"


class Upload(Base):
    __tablename__ = "uploads"

    upload_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    site_id: Mapped[str] = mapped_column(String, ForeignKey("sites.site_id", ondelete="CASCADE"), nullable=False)
    status: Mapped[UploadStatus] = mapped_column(
        Enum(UploadStatus, name="upload_status"), default=UploadStatus.INACTIVE, nullable=False
    )
    uploaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    uploaded_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("technicians.id", ondelete="SET NULL"), nullable=True
    )

    site: Mapped["Site"] = relationship(back_populates="uploads", foreign_keys=[site_id])
    units: Mapped[list["Unit"]] = relationship(back_populates="upload", cascade="all, delete-orphan")
    assignments: Mapped[list["Assignment"]] = relationship(back_populates="upload", cascade="all, delete-orphan")
    skips: Mapped[list["Skip"]] = relationship(back_populates="upload", cascade="all, delete-orphan")


from models.assignment import Assignment  # noqa: E402, F401
from models.site import Site  # noqa: E402, F401
from models.skip import Skip  # noqa: E402, F401
from models.unit import Unit  # noqa: E402, F401

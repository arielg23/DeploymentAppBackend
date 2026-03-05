import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.database import Base


class AssignmentStatus(str, enum.Enum):
    QUEUED = "QUEUED"
    SENT = "SENT"
    CONFLICT = "CONFLICT"
    ERROR = "ERROR"


class Assignment(Base):
    __tablename__ = "assignments"
    __table_args__ = (
        UniqueConstraint("dev_eui_normalized", "upload_id", name="uq_deveui_per_upload"),
        UniqueConstraint("site_id", "unit_id", "upload_id", name="uq_unit_per_upload"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    upload_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("uploads.upload_id", ondelete="CASCADE"), nullable=False
    )
    site_id: Mapped[str] = mapped_column(String, ForeignKey("sites.site_id"), nullable=False)
    unit_id: Mapped[str] = mapped_column(String, nullable=False)
    dev_eui_raw: Mapped[str] = mapped_column(String, nullable=False)
    dev_eui_normalized: Mapped[str] = mapped_column(String(16), nullable=False)
    technician_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("technicians.id"), nullable=False
    )
    timestamp_local: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    timestamp_server: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    status: Mapped[AssignmentStatus] = mapped_column(
        Enum(AssignmentStatus, name="assignment_status"), default=AssignmentStatus.SENT, nullable=False
    )

    upload: Mapped["Upload"] = relationship(back_populates="assignments")
    technician: Mapped["Technician"] = relationship()


from models.technician import Technician  # noqa: E402, F401
from models.upload import Upload  # noqa: E402, F401

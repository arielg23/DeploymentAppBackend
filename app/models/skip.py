import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.database import Base


class Skip(Base):
    __tablename__ = "skips"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    upload_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("uploads.upload_id", ondelete="CASCADE"), nullable=False
    )
    site_id: Mapped[str] = mapped_column(String, ForeignKey("sites.site_id"), nullable=False)
    unit_id: Mapped[str] = mapped_column(String, nullable=False)
    technician_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("technicians.id"), nullable=False
    )
    reason_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("skip_reasons.id", ondelete="SET NULL"), nullable=True
    )
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    upload: Mapped["Upload"] = relationship(back_populates="skips")
    reason: Mapped["SkipReason"] = relationship()


from models.skip_reason import SkipReason  # noqa: E402, F401
from models.upload import Upload  # noqa: E402, F401

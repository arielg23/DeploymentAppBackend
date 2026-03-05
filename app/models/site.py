import uuid

from sqlalchemy import ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.database import Base


class Site(Base):
    __tablename__ = "sites"

    site_id: Mapped[str] = mapped_column(String, primary_key=True)
    site_name: Mapped[str] = mapped_column(String, nullable=False)
    active_upload_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("uploads.upload_id", use_alter=True, name="fk_site_active_upload"), nullable=True
    )

    technician_access: Mapped[list["TechnicianSiteAccess"]] = relationship(back_populates="site")
    uploads: Mapped[list["Upload"]] = relationship(
        back_populates="site", foreign_keys="Upload.site_id", lazy="dynamic"
    )


from models.technician import TechnicianSiteAccess  # noqa: E402, F401
from models.upload import Upload  # noqa: E402, F401

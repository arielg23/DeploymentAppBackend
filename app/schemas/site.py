import uuid
from typing import Optional

from pydantic import BaseModel


class SiteResponse(BaseModel):
    site_id: str
    site_name: str
    active_upload_id: Optional[uuid.UUID] = None

    model_config = {"from_attributes": True}


class ActiveUploadResponse(BaseModel):
    upload_id: uuid.UUID
    site_id: str
    status: str
    uploaded_at: str

    model_config = {"from_attributes": True}

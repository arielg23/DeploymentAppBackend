import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class UnitResponse(BaseModel):
    upload_id: uuid.UUID
    unit_id: str
    site_id: str
    unit_name: str
    sequence: int
    customer_name: Optional[str] = None
    customer_id: Optional[str] = None
    assignment_status: Optional[str] = None
    dev_eui_normalized: Optional[str] = None
    is_skipped: bool = False

    model_config = {"from_attributes": True}

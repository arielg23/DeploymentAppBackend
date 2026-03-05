import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class AssignRequest(BaseModel):
    site_id: str
    unit_id: str
    dev_eui_raw: str
    timestamp_local: datetime


class ConflictDetail(BaseModel):
    assignment_id: uuid.UUID
    site_id: str
    unit_id: str
    dev_eui_normalized: str
    technician_email: str
    timestamp_local: datetime
    timestamp_server: datetime


class AssignResponse(BaseModel):
    assignment_id: uuid.UUID
    status: str


class ConflictResponse(BaseModel):
    conflict_type: str
    existing: ConflictDetail


class SkipRequest(BaseModel):
    site_id: str
    unit_id: str
    reason_id: Optional[uuid.UUID] = None
    timestamp: Optional[datetime] = None


class SkipResponse(BaseModel):
    skip_id: uuid.UUID


class ValidationRequest(BaseModel):
    site_id: str
    dev_eui_normalized: str


class ValidationResponse(BaseModel):
    unit_id: str
    unit_name: str
    site_id: str
    dev_eui_normalized: str
    technician_email: str
    timestamp_local: datetime

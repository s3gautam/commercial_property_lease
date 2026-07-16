import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict

from app.models.lease import LeaseStatus


class LeaseCreate(BaseModel):
    property_id: uuid.UUID
    start_date: date
    end_date: date


class LeaseVersionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    lease_id: uuid.UUID
    version_number: int
    document_text: str | None
    ai_summary: str | None
    created_at: datetime


class LeaseRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    property_id: uuid.UUID
    tenant_id: uuid.UUID
    status: LeaseStatus
    start_date: date
    end_date: date
    monthly_rent: float
    created_at: datetime


class LeaseWithVersionsRead(BaseModel):
    lease: LeaseRead
    versions: list[LeaseVersionRead]

import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict

from app.models.visit import VisitStatus


class VisitCreate(BaseModel):
    property_id: uuid.UUID
    visit_date: date
    visit_time: str


class VisitReschedule(BaseModel):
    visit_date: date
    visit_time: str


class VisitRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    property_id: uuid.UUID
    property_title: str
    tenant_id: uuid.UUID
    visit_date: date
    visit_time: str
    status: VisitStatus
    created_at: datetime

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.property import PropertyStatus


class PropertyRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    description: str
    address: str
    city: str
    state: str
    country: str
    area_sqft: float
    monthly_rent: float
    status: PropertyStatus
    created_at: datetime
    updated_at: datetime


class PropertyListQuery(BaseModel):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
    city: str | None = None

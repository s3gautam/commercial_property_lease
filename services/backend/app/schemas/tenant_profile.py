import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class TenantProfileUpsert(BaseModel):
    company_name: str | None = None
    business_type: str | None = None


class TenantProfileRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    company_name: str | None
    business_type: str | None
    created_at: datetime
    updated_at: datetime

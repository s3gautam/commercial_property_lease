import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.user import UserRole


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: str | None
    phone: str | None
    role: UserRole
    is_email_verified: bool
    is_phone_verified: bool
    is_active: bool
    created_at: datetime
    updated_at: datetime

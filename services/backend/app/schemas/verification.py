import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.property import VerificationReportStatus


class VerificationReportRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    property_id: uuid.UUID
    summary: str
    risk_score: float | None
    status: VerificationReportStatus
    created_at: datetime

import uuid

from sqlalchemy import select

from app.models.property import VerificationReport
from app.repositories.base import BaseRepository


class VerificationReportRepository(BaseRepository[VerificationReport]):
    model = VerificationReport

    async def get_latest_for_property(
        self, property_id: uuid.UUID
    ) -> VerificationReport | None:
        result = await self.session.execute(
            select(VerificationReport)
            .where(VerificationReport.property_id == property_id)
            .order_by(VerificationReport.created_at.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

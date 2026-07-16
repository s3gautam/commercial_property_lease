import uuid

from app.ai.agents.verification_agent import VerificationAgent
from app.models.property import VerificationReport, VerificationReportStatus
from app.repositories.property_repository import PropertyRepository
from app.repositories.verification_report_repository import VerificationReportRepository
from app.services.property_service import PropertyNotFoundError


class VerificationReportNotFoundError(Exception):
    pass


class VerificationService:
    def __init__(
        self,
        properties: PropertyRepository,
        reports: VerificationReportRepository,
    ) -> None:
        self._properties = properties
        self._reports = reports

    async def generate_report(self, property_id: uuid.UUID) -> VerificationReport:
        property_ = await self._properties.get_by_id(property_id)
        if property_ is None:
            raise PropertyNotFoundError("Property not found")

        agent = VerificationAgent()
        agent_response = await agent.run(property_)
        result = agent_response.response

        status = (
            VerificationReportStatus.COMPLETED
            if agent_response.validation_status == "valid"
            else VerificationReportStatus.FAILED
        )

        return await self._reports.create(
            VerificationReport(
                property_id=property_id,
                summary=result.summary,
                risk_score=result.risk_score,
                status=status,
            )
        )

    async def get_latest_report(self, property_id: uuid.UUID) -> VerificationReport:
        report = await self._reports.get_latest_for_property(property_id)
        if report is None:
            raise VerificationReportNotFoundError("No verification report yet")
        return report

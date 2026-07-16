import uuid
from datetime import date

from app.ai.agents.lease_drafting_agent import LeaseDraftingAgent
from app.ai.agents.lease_summary_agent import LeaseSummaryAgent
from app.models.lease import Lease, LeaseVersion
from app.models.property import PropertyStatus
from app.repositories.lease_repository import LeaseRepository
from app.repositories.lease_version_repository import LeaseVersionRepository
from app.repositories.property_repository import PropertyRepository
from app.services.property_service import PropertyNotFoundError


class LeaseNotFoundError(Exception):
    pass


class LeaseDraftNotFoundError(Exception):
    pass


class LeaseService:
    def __init__(
        self,
        leases: LeaseRepository,
        lease_versions: LeaseVersionRepository,
        properties: PropertyRepository,
    ) -> None:
        self._leases = leases
        self._lease_versions = lease_versions
        self._properties = properties

    async def create_lease(
        self, tenant_id: uuid.UUID, property_id: uuid.UUID, start_date: date, end_date: date
    ) -> Lease:
        property_ = await self._properties.get_by_id(property_id)
        if property_ is None or property_.status != PropertyStatus.LISTED:
            raise PropertyNotFoundError("Property not found")

        return await self._leases.create(
            Lease(
                property_id=property_id,
                tenant_id=tenant_id,
                start_date=start_date,
                end_date=end_date,
                monthly_rent=property_.monthly_rent,
            )
        )

    async def list_my_leases(self, tenant_id: uuid.UUID) -> list[Lease]:
        return await self._leases.list_for_tenant(tenant_id)

    async def _get_owned_lease(self, lease_id: uuid.UUID, tenant_id: uuid.UUID) -> Lease:
        lease = await self._leases.get_by_id(lease_id)
        if lease is None or lease.tenant_id != tenant_id:
            raise LeaseNotFoundError("Lease not found")
        return lease

    async def get_lease_with_versions(
        self, lease_id: uuid.UUID, tenant_id: uuid.UUID
    ) -> tuple[Lease, list[LeaseVersion]]:
        lease = await self._get_owned_lease(lease_id, tenant_id)
        versions = await self._lease_versions.list_for_lease(lease_id)
        return lease, versions

    async def draft_document(self, lease_id: uuid.UUID, tenant_id: uuid.UUID) -> LeaseVersion:
        lease = await self._get_owned_lease(lease_id, tenant_id)
        property_ = await self._properties.get_by_id(lease.property_id)
        if property_ is None:
            raise PropertyNotFoundError("Property not found")

        agent = LeaseDraftingAgent()
        agent_response = await agent.run(lease, property_)

        version_number = await self._lease_versions.next_version_number(lease_id)
        return await self._lease_versions.create(
            LeaseVersion(
                lease_id=lease_id,
                version_number=version_number,
                document_text=agent_response.response.document_text,
            )
        )

    async def summarize_latest(self, lease_id: uuid.UUID, tenant_id: uuid.UUID) -> LeaseVersion:
        await self._get_owned_lease(lease_id, tenant_id)

        latest = await self._lease_versions.get_latest_for_lease(lease_id)
        if latest is None or not latest.document_text:
            raise LeaseDraftNotFoundError("No draft to summarize yet")

        agent = LeaseSummaryAgent()
        agent_response = await agent.run(latest.document_text)

        latest.ai_summary = agent_response.response.summary_text
        return latest

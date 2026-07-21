import uuid
from dataclasses import dataclass
from datetime import date

from app.models.visit import Visit, VisitStatus
from app.repositories.property_repository import PropertyRepository
from app.repositories.visit_repository import VisitRepository
from app.services.booking_notification_service import BookingNotificationService
from app.services.visit_schedule import is_slot_available


class VisitNotFoundError(Exception):
    pass


class SlotUnavailableError(Exception):
    pass


class VisitConflictError(Exception):
    def __init__(self, reason: str, message: str) -> None:
        super().__init__(message)
        self.reason = reason
        self.message = message


@dataclass
class VisitWithProperty:
    visit: Visit
    property_title: str


class VisitService:
    def __init__(
        self,
        visits: VisitRepository,
        properties: PropertyRepository,
        notifications: BookingNotificationService,
    ) -> None:
        self._visits = visits
        self._properties = properties
        self._notifications = notifications

    async def _get_owned_visit(self, visit_id: uuid.UUID, tenant_id: uuid.UUID) -> Visit:
        visit = await self._visits.get_by_id(visit_id)
        if visit is None or visit.tenant_id != tenant_id:
            raise VisitNotFoundError("Visit not found")
        return visit

    async def _property_title(self, property_id: uuid.UUID) -> str:
        property_ = await self._properties.get_by_id(property_id)
        return property_.title if property_ else "this property"

    async def list_my_visits(self, tenant_id: uuid.UUID) -> list[VisitWithProperty]:
        visits = await self._visits.list_for_tenant(tenant_id)
        # Small, per-tenant list (their own visits) - fine to fetch titles
        # one at a time at this dataset's scale rather than adding a join.
        return [
            VisitWithProperty(visit=v, property_title=await self._property_title(v.property_id))
            for v in visits
        ]

    async def book_visit(
        self,
        tenant_id: uuid.UUID,
        tenant_email: str | None,
        property_id: uuid.UUID,
        visit_date: date,
        visit_time: str,
    ) -> VisitWithProperty:
        property_ = await self._properties.get_by_id(property_id)
        if property_ is None:
            raise VisitNotFoundError("Property not found")

        # Never trust a booking request for a slot that isn't actually
        # available, whether it came from the manual picker or a chat
        # confirmation the client is relaying - re-checked here in code,
        # same principle as LandlordChatAgent's own validation.
        if not is_slot_available(property_id, visit_date, visit_time):
            raise SlotUnavailableError("That slot is no longer available")

        conflict = await self._visits.find_conflict(tenant_id, property_id, visit_date, visit_time)
        if conflict is not None:
            raise self._conflict_error(conflict, property_id)

        visit = await self._visits.create(
            Visit(
                property_id=property_id,
                tenant_id=tenant_id,
                visit_date=visit_date,
                visit_time=visit_time,
                status=VisitStatus.UPCOMING,
            )
        )

        if tenant_email:
            await self._notifications.notify(
                email=tenant_email,
                property_title=property_.title,
                date=visit_date.isoformat(),
                time=visit_time,
                action="booked",
            )

        return VisitWithProperty(visit=visit, property_title=property_.title)

    async def reschedule_visit(
        self,
        visit_id: uuid.UUID,
        tenant_id: uuid.UUID,
        tenant_email: str | None,
        visit_date: date,
        visit_time: str,
    ) -> VisitWithProperty:
        visit = await self._get_owned_visit(visit_id, tenant_id)

        if not is_slot_available(visit.property_id, visit_date, visit_time):
            raise SlotUnavailableError("That slot is no longer available")

        conflict = await self._visits.find_conflict(
            tenant_id, visit.property_id, visit_date, visit_time, exclude_visit_id=visit_id
        )
        if conflict is not None:
            raise self._conflict_error(conflict, visit.property_id)

        visit.visit_date = visit_date
        visit.visit_time = visit_time
        visit.status = VisitStatus.UPCOMING

        property_title = await self._property_title(visit.property_id)
        if tenant_email:
            await self._notifications.notify(
                email=tenant_email,
                property_title=property_title,
                date=visit_date.isoformat(),
                time=visit_time,
                action="rescheduled",
            )

        return VisitWithProperty(visit=visit, property_title=property_title)

    async def cancel_visit(self, visit_id: uuid.UUID, tenant_id: uuid.UUID) -> VisitWithProperty:
        visit = await self._get_owned_visit(visit_id, tenant_id)
        visit.status = VisitStatus.CANCELLED
        return VisitWithProperty(visit=visit, property_title=await self._property_title(visit.property_id))

    def _conflict_error(self, conflict: Visit, property_id: uuid.UUID) -> VisitConflictError:
        if conflict.property_id == property_id:
            return VisitConflictError(
                "same_property",
                "You already have a visit scheduled for this property. Cancel or "
                "reschedule it first.",
            )
        return VisitConflictError(
            "same_time_other_property", "You already have another visit booked at that exact time."
        )

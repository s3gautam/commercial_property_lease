import uuid
from dataclasses import dataclass
from datetime import date

from app.ai.base_agent import AgentResponse, BaseAgent
from app.ai.output_validator import OutputValidationError, parse_json_response, require_keys
from app.ai.prompt_builder import PromptBuilder
from app.models.property import Property
from app.services.property_facts import NearbyLandmark
from app.services.visit_schedule import DaySlots, get_available_slots, is_slot_available

SYSTEM_PROMPT = (
    "You are role-playing as a commercial property landlord replying to a "
    "prospective tenant. Stay in character at all times and never reveal "
    "that you are an AI. Only state facts given to you about the listing - "
    "never invent details. If asked something the listing doesn't cover, "
    "say so honestly and in character rather than making something up. "
    "Only confirm a visit booking for a slot that is actually listed as "
    "available and that the tenant has clearly confirmed."
)

FALLBACK_REPLY = (
    "Sorry, I got pulled away for a moment there — could you say that again? "
    "Happy to help with whatever you need to know about the place."
)

MIN_VALID_LENGTH = 2


@dataclass
class LandlordChatMessage:
    role: str  # "tenant" or "landlord"
    content: str


@dataclass
class LandlordChatReply:
    reply: str
    booking_date: str | None = None
    booking_time: str | None = None


class LandlordChatAgent(BaseAgent[LandlordChatReply]):
    """Replies to a tenant's chat message in character as the property's
    landlord, grounded in the listing details. Can also propose visit
    slots and, once the tenant explicitly confirms one, signal a booking
    - always validated against real availability before being trusted."""

    async def run(
        self,
        property_: Property,
        message: str,
        history: list[LandlordChatMessage] | None = None,
    ) -> AgentResponse[LandlordChatReply]:
        history_text = _format_history(history or [])
        amenities_text = _format_amenities(property_.amenities)
        nearby_text = _format_nearby(property_.nearby_landmarks)
        available_slots = get_available_slots(property_.id)
        slots_text = _format_available_slots(available_slots)

        prompt = PromptBuilder("landlord_chat.v1.txt").build(
            title=property_.title,
            address=property_.address,
            city=property_.city,
            state=property_.state,
            country=property_.country,
            area_sqft=str(property_.area_sqft),
            monthly_rent=str(property_.monthly_rent),
            description=property_.description,
            amenities=amenities_text,
            nearby=nearby_text,
            available_slots=slots_text,
            today=date.today().strftime("%A, %Y-%m-%d"),
            history=history_text,
            message=message,
        )
        llm_result = await self.gateway.complete(SYSTEM_PROMPT, prompt, json_mode=True)

        try:
            payload = parse_json_response(llm_result.content)
            require_keys(payload, "reply")
            result = LandlordChatReply(reply=str(payload["reply"]).strip())
            result = _attach_validated_booking(result, payload.get("booking"), property_.id)
            validation_status = "valid" if self.validate(result) else "invalid"
        except (OutputValidationError, TypeError, ValueError):
            result = LandlordChatReply(reply="")
            validation_status = "invalid"

        if validation_status == "invalid":
            result = LandlordChatReply(reply=FALLBACK_REPLY)

        return AgentResponse(
            response=result,
            confidence=self.confidence_score(result),
            latency_ms=llm_result.latency_ms,
            prompt_tokens=llm_result.prompt_tokens,
            completion_tokens=llm_result.completion_tokens,
            total_tokens=llm_result.total_tokens,
            reasoning_metadata={"property_id": str(property_.id)},
            validation_status=validation_status,
        )

    def validate(self, result: LandlordChatReply) -> bool:
        return len(result.reply.strip()) >= MIN_VALID_LENGTH

    def explain(self, result: LandlordChatReply) -> str:
        return "Generated in character as the property's landlord, grounded in the listing details."

    def confidence_score(self, result: LandlordChatReply) -> float:
        return 0.7 if self.validate(result) else 0.2


def _attach_validated_booking(
    result: LandlordChatReply, booking: object, property_id: uuid.UUID
) -> LandlordChatReply:
    if not isinstance(booking, dict):
        return result

    booking_date = booking.get("date")
    booking_time = booking.get("time")
    if not isinstance(booking_date, str) or not isinstance(booking_time, str):
        return result

    try:
        parsed_date = date.fromisoformat(booking_date)
    except ValueError:
        return result

    # Never trust a booking confirmation for a slot that isn't actually
    # available - the model can hallucinate confidently even when told
    # not to, so this is checked in code, not just prompted against.
    if not is_slot_available(property_id, parsed_date, booking_time):
        return result

    result.booking_date = booking_date
    result.booking_time = booking_time
    return result


def _format_history(history: list[LandlordChatMessage]) -> str:
    if not history:
        return "(no previous messages)"
    lines = []
    for entry in history:
        speaker = "Landlord (you)" if entry.role == "landlord" else "Tenant"
        lines.append(f"{speaker}: {entry.content}")
    return "\n".join(lines)


def _format_amenities(amenities: list[str]) -> str:
    if not amenities:
        return "(none listed)"
    return "\n".join(f"- {amenity}" for amenity in amenities)


def _format_nearby(landmarks: list[NearbyLandmark]) -> str:
    if not landmarks:
        return "(none listed)"
    return "\n".join(f"- {lm.name}: {lm.distance_km} km away" for lm in landmarks)


def _format_available_slots(day_slots: list[DaySlots]) -> str:
    if not day_slots:
        return "(no slots available in the next 7 days)"
    lines = []
    for day in day_slots:
        weekday = day.day.strftime("%a")
        lines.append(f"- {weekday} {day.day.isoformat()}: {', '.join(day.times)}")
    return "\n".join(lines)

from dataclasses import dataclass

from app.ai.base_agent import AgentResponse, BaseAgent
from app.ai.prompt_builder import PromptBuilder
from app.models.property import Property
from app.services.property_facts import NearbyLandmark

SYSTEM_PROMPT = (
    "You are role-playing as a commercial property landlord replying to a "
    "prospective tenant. Stay in character at all times and never reveal "
    "that you are an AI. Only state facts given to you about the listing - "
    "never invent details. If asked something the listing doesn't cover, "
    "say so honestly and in character rather than making something up."
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


class LandlordChatAgent(BaseAgent[LandlordChatReply]):
    """Replies to a tenant's chat message in character as the property's
    landlord, grounded in the listing details, improvising a plausible
    in-character answer for anything the listing doesn't cover."""

    async def run(
        self,
        property_: Property,
        message: str,
        history: list[LandlordChatMessage] | None = None,
    ) -> AgentResponse[LandlordChatReply]:
        history_text = _format_history(history or [])
        amenities_text = _format_amenities(property_.amenities)
        nearby_text = _format_nearby(property_.nearby_landmarks)

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
            history=history_text,
            message=message,
        )
        llm_result = await self.gateway.complete(SYSTEM_PROMPT, prompt)

        result = LandlordChatReply(reply=llm_result.content.strip())
        validation_status = "valid" if self.validate(result) else "invalid"
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

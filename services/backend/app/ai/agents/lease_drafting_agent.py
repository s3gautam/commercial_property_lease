from dataclasses import dataclass

from app.ai.base_agent import AgentResponse, BaseAgent
from app.ai.prompt_builder import PromptBuilder
from app.models.lease import Lease
from app.models.property import Property

SYSTEM_PROMPT = (
    "You are a meticulous commercial lease drafting assistant. You produce "
    "clear, plain-language draft documents and always note that they are "
    "drafts requiring legal review, never legal advice."
)

MIN_VALID_LENGTH = 200


@dataclass
class LeaseDraft:
    document_text: str


class LeaseDraftingAgent(BaseAgent[LeaseDraft]):
    """Drafts a plain-language lease document for a given lease + property."""

    async def run(self, lease: Lease, property_: Property) -> AgentResponse[LeaseDraft]:
        prompt = PromptBuilder("lease_draft.v1.txt").build(
            property_title=property_.title,
            property_address=property_.address,
            property_city=property_.city,
            property_state=property_.state,
            monthly_rent=str(lease.monthly_rent),
            start_date=lease.start_date.isoformat(),
            end_date=lease.end_date.isoformat(),
        )
        llm_result = await self.gateway.complete(SYSTEM_PROMPT, prompt)

        result = LeaseDraft(document_text=llm_result.content.strip())
        validation_status = "valid" if self.validate(result) else "invalid"

        return AgentResponse(
            response=result,
            confidence=self.confidence_score(result),
            latency_ms=llm_result.latency_ms,
            prompt_tokens=llm_result.prompt_tokens,
            completion_tokens=llm_result.completion_tokens,
            total_tokens=llm_result.total_tokens,
            reasoning_metadata={"lease_id": str(lease.id)},
            validation_status=validation_status,
        )

    def validate(self, result: LeaseDraft) -> bool:
        return len(result.document_text) >= MIN_VALID_LENGTH

    def explain(self, result: LeaseDraft) -> str:
        return "Drafted from the lease's property, rent, and term details."

    def confidence_score(self, result: LeaseDraft) -> float:
        return 0.75 if self.validate(result) else 0.2

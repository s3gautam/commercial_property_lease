from dataclasses import dataclass

from app.ai.base_agent import AgentResponse, BaseAgent
from app.ai.prompt_builder import PromptBuilder

SYSTEM_PROMPT = (
    "You are a plain-language explainer for commercial leases. You "
    "summarize accurately without giving legal advice."
)

MIN_VALID_LENGTH = 30


@dataclass
class LeaseSummary:
    summary_text: str


class LeaseSummaryAgent(BaseAgent[LeaseSummary]):
    """Summarizes an existing lease document into plain language."""

    async def run(self, lease_text: str) -> AgentResponse[LeaseSummary]:
        prompt = PromptBuilder("lease_summary.v1.txt").build(lease_text=lease_text)
        llm_result = await self.gateway.complete(SYSTEM_PROMPT, prompt)

        result = LeaseSummary(summary_text=llm_result.content.strip())
        validation_status = "valid" if self.validate(result) else "invalid"

        return AgentResponse(
            response=result,
            confidence=self.confidence_score(result),
            latency_ms=llm_result.latency_ms,
            prompt_tokens=llm_result.prompt_tokens,
            completion_tokens=llm_result.completion_tokens,
            total_tokens=llm_result.total_tokens,
            reasoning_metadata={},
            validation_status=validation_status,
        )

    def validate(self, result: LeaseSummary) -> bool:
        return len(result.summary_text) >= MIN_VALID_LENGTH

    def explain(self, result: LeaseSummary) -> str:
        return "Summarized from the lease document's full text."

    def confidence_score(self, result: LeaseSummary) -> float:
        return 0.75 if self.validate(result) else 0.2

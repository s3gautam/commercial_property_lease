from dataclasses import dataclass

from app.ai.base_agent import AgentResponse, BaseAgent
from app.ai.output_validator import OutputValidationError, parse_json_response, require_keys
from app.ai.prompt_builder import PromptBuilder
from app.models.property import Property

SYSTEM_PROMPT = (
    "You are a careful, conservative property-listing reviewer. You only "
    "ever respond with the exact JSON object requested, and you never "
    "invent details not present in the listing."
)

FALLBACK_SUMMARY = (
    "Automated verification could not be completed for this listing. "
    "Please review the details manually before proceeding."
)


@dataclass
class VerificationResult:
    summary: str
    risk_score: float


class VerificationAgent(BaseAgent[VerificationResult]):
    """Reviews a property listing and produces a risk summary + score."""

    async def run(self, property_: Property) -> AgentResponse[VerificationResult]:
        prompt = PromptBuilder("property_verification.v1.txt").build(
            title=property_.title,
            address=property_.address,
            city=property_.city,
            state=property_.state,
            country=property_.country,
            area_sqft=str(property_.area_sqft),
            monthly_rent=str(property_.monthly_rent),
            description=property_.description,
        )
        llm_result = await self.gateway.complete(SYSTEM_PROMPT, prompt, json_mode=True)

        try:
            payload = parse_json_response(llm_result.content)
            require_keys(payload, "summary", "risk_score")
            result = VerificationResult(
                summary=str(payload["summary"]), risk_score=float(payload["risk_score"])
            )
            validation_status = "valid" if self.validate(result) else "invalid"
        except (OutputValidationError, TypeError, ValueError):
            result = VerificationResult(summary=FALLBACK_SUMMARY, risk_score=100.0)
            validation_status = "invalid"

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

    def validate(self, result: VerificationResult) -> bool:
        return bool(result.summary) and 0 <= result.risk_score <= 100

    def explain(self, result: VerificationResult) -> str:
        return result.summary

    def confidence_score(self, result: VerificationResult) -> float:
        return 0.8 if self.validate(result) else 0.2

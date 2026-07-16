from dataclasses import dataclass, field
from typing import Any

from app.ai.base_agent import AgentResponse, BaseAgent
from app.ai.output_validator import OutputValidationError, parse_json_response, require_keys
from app.ai.prompt_builder import PromptBuilder
from app.models.property import Property
from app.repositories.property_repository import PropertyRepository

SYSTEM_PROMPT = (
    "You are a precise information-extraction assistant. You only ever "
    "respond with the exact JSON object requested."
)


@dataclass
class SearchCriteria:
    city: str | None
    max_rent: float | None
    min_area_sqft: float | None
    keywords: list[str] = field(default_factory=list)
    explanation: str = ""


@dataclass
class SearchResult:
    criteria: SearchCriteria
    properties: list[Property]


class SearchAgent(BaseAgent[SearchResult]):
    """Extracts structured filters from a natural-language query and returns
    matching listed properties."""

    def __init__(self, property_repository: PropertyRepository, **kwargs: Any) -> None:
        super().__init__(**kwargs)
        self._properties = property_repository

    async def run(self, query: str, limit: int = 20) -> AgentResponse[SearchResult]:
        prompt = PromptBuilder("property_search.v1.txt").build(query=query)
        llm_result = await self.gateway.complete(SYSTEM_PROMPT, prompt, json_mode=True)

        try:
            payload = parse_json_response(llm_result.content)
            require_keys(payload, "keywords", "explanation")
            criteria = SearchCriteria(
                city=payload.get("city"),
                max_rent=payload.get("max_rent"),
                min_area_sqft=payload.get("min_area_sqft"),
                keywords=list(payload.get("keywords") or []),
                explanation=payload["explanation"],
            )
            validation_status = "valid"
        except OutputValidationError:
            # Fall back to an unfiltered keyword-only search from the raw
            # query rather than failing the whole request.
            criteria = SearchCriteria(
                city=None, max_rent=None, min_area_sqft=None, keywords=[query], explanation=""
            )
            validation_status = "invalid"

        properties = await self._properties.search_listed(
            limit=limit,
            city=criteria.city,
            max_rent=criteria.max_rent,
            min_area_sqft=criteria.min_area_sqft,
            keywords=criteria.keywords,
        )

        result = SearchResult(criteria=criteria, properties=properties)

        return AgentResponse(
            response=result,
            confidence=self.confidence_score(result),
            latency_ms=llm_result.latency_ms,
            prompt_tokens=llm_result.prompt_tokens,
            completion_tokens=llm_result.completion_tokens,
            total_tokens=llm_result.total_tokens,
            reasoning_metadata={
                "city": criteria.city,
                "max_rent": criteria.max_rent,
                "min_area_sqft": criteria.min_area_sqft,
                "keywords": criteria.keywords,
            },
            validation_status=validation_status,
        )

    def validate(self, result: SearchResult) -> bool:
        return bool(result.criteria.explanation) or bool(result.criteria.keywords)

    def explain(self, result: SearchResult) -> str:
        return result.criteria.explanation or "Matched on raw query keywords."

    def confidence_score(self, result: SearchResult) -> float:
        if not result.properties:
            return 0.3
        has_structured_filters = any(
            (result.criteria.city, result.criteria.max_rent, result.criteria.min_area_sqft)
        )
        return 0.85 if has_structured_filters else 0.6

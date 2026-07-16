from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, Generic, TypeVar

from app.ai.gateway import LLMGateway

TResult = TypeVar("TResult")


@dataclass
class AgentResponse(Generic[TResult]):
    response: TResult
    confidence: float
    latency_ms: float
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    reasoning_metadata: dict[str, Any] = field(default_factory=dict)
    validation_status: str = "unchecked"


class BaseAgent(ABC, Generic[TResult]):
    """Every AI capability is an Agent exposing run/validate/explain/confidence_score,
    matching the Application -> Agent -> Prompt Builder -> LLM Gateway -> Groq ->
    Output Validator architecture."""

    def __init__(self, gateway: LLMGateway | None = None) -> None:
        self.gateway = gateway or LLMGateway()

    @abstractmethod
    async def run(self, **kwargs: Any) -> AgentResponse[TResult]:
        """Execute the agent and return a validated, scored response."""

    @abstractmethod
    def validate(self, result: TResult) -> bool:
        """Validate the raw LLM output before it reaches the application."""

    @abstractmethod
    def explain(self, result: TResult) -> str:
        """Human-readable explanation of how the result was produced."""

    @abstractmethod
    def confidence_score(self, result: TResult) -> float:
        """Confidence score in [0, 1] for the produced result."""

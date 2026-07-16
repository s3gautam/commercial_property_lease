import uuid
from datetime import date
from unittest.mock import AsyncMock

import pytest

from app.ai.agents.lease_drafting_agent import LeaseDraftingAgent
from app.ai.agents.lease_summary_agent import LeaseSummaryAgent
from app.ai.agents.search_agent import SearchAgent
from app.ai.agents.verification_agent import VerificationAgent
from app.ai.gateway import LLMResult
from app.models.lease import Lease, LeaseStatus
from app.models.property import Property, PropertyStatus


def _llm_result(content: str) -> LLMResult:
    return LLMResult(content=content, latency_ms=10.0, prompt_tokens=5, completion_tokens=5, total_tokens=10)


def _property() -> Property:
    return Property(
        id=uuid.uuid4(),
        title="Test Office",
        description="A nice office space.",
        address="1 Main St",
        city="Austin",
        state="TX",
        country="USA",
        area_sqft=1000,
        monthly_rent=3000,
        status=PropertyStatus.LISTED,
    )


def _lease(property_id: uuid.UUID) -> Lease:
    return Lease(
        id=uuid.uuid4(),
        property_id=property_id,
        tenant_id=uuid.uuid4(),
        status=LeaseStatus.DRAFT,
        start_date=date(2026, 1, 1),
        end_date=date(2026, 12, 31),
        monthly_rent=3000,
    )


@pytest.mark.asyncio
async def test_search_agent_parses_structured_criteria() -> None:
    mock_repo = AsyncMock()
    mock_repo.search_listed.return_value = [_property()]

    agent = SearchAgent(mock_repo)
    agent.gateway.complete = AsyncMock(
        return_value=_llm_result(
            '{"city": "Austin", "max_rent": 5000, "min_area_sqft": null, '
            '"keywords": ["office"], "explanation": "Office in Austin under 5000"}'
        )
    )

    response = await agent.run(query="office in austin under 5000")

    assert response.validation_status == "valid"
    assert response.response.criteria.city == "Austin"
    assert response.response.criteria.max_rent == 5000
    assert len(response.response.properties) == 1
    mock_repo.search_listed.assert_called_once_with(
        limit=20, city="Austin", max_rent=5000, min_area_sqft=None, keywords=["office"]
    )


@pytest.mark.asyncio
async def test_search_agent_falls_back_on_invalid_json() -> None:
    mock_repo = AsyncMock()
    mock_repo.search_listed.return_value = []

    agent = SearchAgent(mock_repo)
    agent.gateway.complete = AsyncMock(return_value=_llm_result("not valid json"))

    response = await agent.run(query="something odd")

    assert response.validation_status == "invalid"
    assert response.response.criteria.keywords == ["something odd"]


@pytest.mark.asyncio
async def test_verification_agent_parses_summary_and_score() -> None:
    agent = VerificationAgent()
    agent.gateway.complete = AsyncMock(
        return_value=_llm_result('{"summary": "Looks standard.", "risk_score": 20}')
    )

    response = await agent.run(_property())

    assert response.validation_status == "valid"
    assert response.response.summary == "Looks standard."
    assert response.response.risk_score == 20.0
    assert response.confidence == 0.8


@pytest.mark.asyncio
async def test_verification_agent_falls_back_on_invalid_json() -> None:
    agent = VerificationAgent()
    agent.gateway.complete = AsyncMock(return_value=_llm_result("garbage"))

    response = await agent.run(_property())

    assert response.validation_status == "invalid"
    assert response.response.risk_score == 100.0


@pytest.mark.asyncio
async def test_lease_drafting_agent_produces_long_enough_draft() -> None:
    property_ = _property()
    lease = _lease(property_.id)

    agent = LeaseDraftingAgent()
    agent.gateway.complete = AsyncMock(return_value=_llm_result("Lease Agreement\n\n" + "x" * 300))

    response = await agent.run(lease, property_)

    assert response.validation_status == "valid"
    assert response.confidence == 0.75


@pytest.mark.asyncio
async def test_lease_drafting_agent_flags_too_short_draft() -> None:
    property_ = _property()
    lease = _lease(property_.id)

    agent = LeaseDraftingAgent()
    agent.gateway.complete = AsyncMock(return_value=_llm_result("too short"))

    response = await agent.run(lease, property_)

    assert response.validation_status == "invalid"
    assert response.confidence == 0.2


@pytest.mark.asyncio
async def test_lease_summary_agent_summarizes() -> None:
    agent = LeaseSummaryAgent()
    agent.gateway.complete = AsyncMock(
        return_value=_llm_result("This lease runs for 12 months at $3000/month rent.")
    )

    response = await agent.run("(full lease text)")

    assert response.validation_status == "valid"
    assert "12 months" in response.response.summary_text

import uuid
from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.gateway import LLMResult
from app.models.property import Property, PropertyStatus


def _llm_result(content: str) -> LLMResult:
    return LLMResult(
        content=content, latency_ms=10.0, prompt_tokens=5, completion_tokens=5, total_tokens=10
    )


async def _create_listed_property(session: AsyncSession, **overrides) -> Property:
    defaults = dict(
        title="Downtown Office Suite",
        description="A bright office suite in the heart of downtown.",
        address="123 Main St",
        city="Austin",
        state="TX",
        country="USA",
        area_sqft=1200,
        monthly_rent=4500,
        status=PropertyStatus.LISTED,
    )
    defaults.update(overrides)
    property_ = Property(**defaults)
    session.add(property_)
    await session.commit()
    await session.refresh(property_)
    return property_


@pytest.fixture
async def db_session():
    from app.core.database import async_session_factory

    async with async_session_factory() as session:
        yield session


async def _login(client: AsyncClient, email: str, code: str) -> str:
    with patch("secrets.randbelow", return_value=int(code)):
        await client.post("/api/v1/auth/otp/request", json={"email": email})

    response = await client.post("/api/v1/auth/otp/verify", json={"email": email, "code": code})
    return response.json()["data"]["tokens"]["access_token"]


@pytest.mark.asyncio
async def test_search_endpoint_returns_matches(client: AsyncClient, db_session) -> None:
    await _create_listed_property(db_session, city="Austin")
    await _create_listed_property(db_session, city="Dallas")

    with patch(
        "app.ai.gateway.LLMGateway.complete",
        AsyncMock(
            return_value=_llm_result(
                '{"city": "Austin", "max_rent": null, "min_area_sqft": null, '
                '"keywords": [], "explanation": "Looking for space in Austin"}'
            )
        ),
    ):
        response = await client.get("/api/v1/properties/search", params={"q": "space in austin"})

    assert response.status_code == 200
    body = response.json()
    assert body["data"]["criteria"]["city"] == "Austin"
    assert len(body["data"]["properties"]) == 1
    assert body["data"]["properties"][0]["city"] == "Austin"


@pytest.mark.asyncio
async def test_search_endpoint_requires_query_param(client: AsyncClient) -> None:
    response = await client.get("/api/v1/properties/search")
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_generate_verification_report_requires_auth(
    client: AsyncClient, db_session
) -> None:
    property_ = await _create_listed_property(db_session)
    response = await client.post(f"/api/v1/properties/{property_.id}/verification")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_generate_and_fetch_verification_report(client: AsyncClient, db_session) -> None:
    property_ = await _create_listed_property(db_session)
    access_token = await _login(client, "verifier@example.com", "111222")
    headers = {"Authorization": f"Bearer {access_token}"}

    with patch(
        "app.ai.gateway.LLMGateway.complete",
        AsyncMock(return_value=_llm_result('{"summary": "Looks fine.", "risk_score": 10}')),
    ):
        response = await client.post(
            f"/api/v1/properties/{property_.id}/verification", headers=headers
        )
    assert response.status_code == 200
    body = response.json()["data"]
    assert body["summary"] == "Looks fine."
    assert body["status"] == "completed"

    fetch_response = await client.get(f"/api/v1/properties/{property_.id}/verification")
    assert fetch_response.status_code == 200
    assert fetch_response.json()["data"]["summary"] == "Looks fine."


@pytest.mark.asyncio
async def test_verification_report_404_before_generation(client: AsyncClient, db_session) -> None:
    property_ = await _create_listed_property(db_session)
    response = await client.get(f"/api/v1/properties/{property_.id}/verification")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_lease_create_draft_and_summarize_flow(client: AsyncClient, db_session) -> None:
    property_ = await _create_listed_property(db_session)
    access_token = await _login(client, "lease-tenant@example.com", "333444")
    headers = {"Authorization": f"Bearer {access_token}"}

    create_response = await client.post(
        "/api/v1/leases",
        json={
            "property_id": str(property_.id),
            "start_date": "2026-01-01",
            "end_date": "2026-12-31",
        },
        headers=headers,
    )
    assert create_response.status_code == 200
    lease_id = create_response.json()["data"]["id"]

    with patch(
        "app.ai.gateway.LLMGateway.complete",
        AsyncMock(return_value=_llm_result("Lease Agreement\n\n" + "x" * 300)),
    ):
        draft_response = await client.post(
            f"/api/v1/leases/{lease_id}/draft", headers=headers
        )
    assert draft_response.status_code == 200
    draft_body = draft_response.json()["data"]
    assert draft_body["version_number"] == 1
    assert draft_body["document_text"]

    with patch(
        "app.ai.gateway.LLMGateway.complete",
        AsyncMock(return_value=_llm_result("This lease runs for 12 months at a fixed rent.")),
    ):
        summary_response = await client.post(
            f"/api/v1/leases/{lease_id}/summary", headers=headers
        )
    assert summary_response.status_code == 200
    assert "12 months" in summary_response.json()["data"]["ai_summary"]

    get_response = await client.get(f"/api/v1/leases/{lease_id}", headers=headers)
    assert get_response.status_code == 200
    lease_body = get_response.json()["data"]
    assert lease_body["lease"]["id"] == lease_id
    assert len(lease_body["versions"]) == 1


@pytest.mark.asyncio
async def test_lease_summary_before_draft_returns_409(client: AsyncClient, db_session) -> None:
    property_ = await _create_listed_property(db_session)
    access_token = await _login(client, "lease-tenant2@example.com", "555666")
    headers = {"Authorization": f"Bearer {access_token}"}

    create_response = await client.post(
        "/api/v1/leases",
        json={
            "property_id": str(property_.id),
            "start_date": "2026-01-01",
            "end_date": "2026-12-31",
        },
        headers=headers,
    )
    lease_id = create_response.json()["data"]["id"]

    response = await client.post(f"/api/v1/leases/{lease_id}/summary", headers=headers)
    assert response.status_code == 409


@pytest.mark.asyncio
async def test_chat_endpoint_requires_auth(client: AsyncClient, db_session) -> None:
    property_ = await _create_listed_property(db_session)
    response = await client.post(
        f"/api/v1/properties/{property_.id}/chat", json={"message": "Is this still available?"}
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_chat_endpoint_returns_landlord_reply(client: AsyncClient, db_session) -> None:
    property_ = await _create_listed_property(db_session)
    access_token = await _login(client, "chat-tenant@example.com", "222333")
    headers = {"Authorization": f"Bearer {access_token}"}

    with patch(
        "app.ai.gateway.LLMGateway.complete",
        AsyncMock(
            return_value=_llm_result(
                '{"reply": "Sure, it\'s available from the 1st!", "booking": null}'
            )
        ),
    ):
        response = await client.post(
            f"/api/v1/properties/{property_.id}/chat",
            json={"message": "Is this available soon?"},
            headers=headers,
        )

    assert response.status_code == 200
    assert response.json()["data"]["reply"] == "Sure, it's available from the 1st!"
    assert response.json()["data"]["booking"] is None


@pytest.mark.asyncio
async def test_chat_endpoint_confirms_booking_for_real_slot(
    client: AsyncClient, db_session
) -> None:
    from app.services.visit_schedule import get_available_slots

    property_ = await _create_listed_property(db_session)
    access_token = await _login(client, "chat-tenant3@example.com", "666777")
    headers = {"Authorization": f"Bearer {access_token}"}

    slots = get_available_slots(property_.id)
    assert slots
    day, time = slots[0].day, slots[0].times[0]

    with patch(
        "app.ai.gateway.LLMGateway.complete",
        AsyncMock(
            return_value=_llm_result(
                f'{{"reply": "Great, see you then!", '
                f'"booking": {{"date": "{day.isoformat()}", "time": "{time}"}}}}'
            )
        ),
    ):
        response = await client.post(
            f"/api/v1/properties/{property_.id}/chat",
            json={"message": "Yes let's book that"},
            headers=headers,
        )

    assert response.status_code == 200
    body = response.json()["data"]
    assert body["booking"] == {"date": day.isoformat(), "time": time}


@pytest.mark.asyncio
async def test_chat_endpoint_404s_for_unknown_property(client: AsyncClient) -> None:
    access_token = await _login(client, "chat-tenant2@example.com", "444555")
    headers = {"Authorization": f"Bearer {access_token}"}

    response = await client.post(
        f"/api/v1/properties/{uuid.uuid4()}/chat",
        json={"message": "Hello?"},
        headers=headers,
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_lease_access_requires_ownership(client: AsyncClient, db_session) -> None:
    property_ = await _create_listed_property(db_session)
    owner_token = await _login(client, "lease-owner@example.com", "777888")
    other_token = await _login(client, "lease-other@example.com", "999000")

    create_response = await client.post(
        "/api/v1/leases",
        json={
            "property_id": str(property_.id),
            "start_date": "2026-01-01",
            "end_date": "2026-12-31",
        },
        headers={"Authorization": f"Bearer {owner_token}"},
    )
    lease_id = create_response.json()["data"]["id"]

    response = await client.get(
        f"/api/v1/leases/{lease_id}", headers={"Authorization": f"Bearer {other_token}"}
    )
    assert response.status_code == 404

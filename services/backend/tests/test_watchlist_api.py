from unittest.mock import patch

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.property import Property, PropertyStatus


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
async def test_watchlist_requires_auth(client: AsyncClient) -> None:
    response = await client.get("/api/v1/watchlist")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_add_list_and_remove_watchlist_item(client: AsyncClient, db_session) -> None:
    property_ = await _create_listed_property(db_session)
    token = await _login(client, "tenant@example.com", "111111")
    headers = {"Authorization": f"Bearer {token}"}

    add_response = await client.post(
        "/api/v1/watchlist", json={"property_id": str(property_.id)}, headers=headers
    )
    assert add_response.status_code == 200
    assert add_response.json()["data"]["id"] == str(property_.id)

    list_response = await client.get("/api/v1/watchlist", headers=headers)
    assert list_response.status_code == 200
    assert [p["id"] for p in list_response.json()["data"]] == [str(property_.id)]

    remove_response = await client.delete(f"/api/v1/watchlist/{property_.id}", headers=headers)
    assert remove_response.status_code == 200

    empty_list = await client.get("/api/v1/watchlist", headers=headers)
    assert empty_list.json()["data"] == []


@pytest.mark.asyncio
async def test_adding_twice_is_idempotent(client: AsyncClient, db_session) -> None:
    property_ = await _create_listed_property(db_session)
    token = await _login(client, "tenant2@example.com", "222222")
    headers = {"Authorization": f"Bearer {token}"}

    await client.post("/api/v1/watchlist", json={"property_id": str(property_.id)}, headers=headers)
    second = await client.post(
        "/api/v1/watchlist", json={"property_id": str(property_.id)}, headers=headers
    )
    assert second.status_code == 200

    list_response = await client.get("/api/v1/watchlist", headers=headers)
    assert len(list_response.json()["data"]) == 1


@pytest.mark.asyncio
async def test_removing_unwatchlisted_property_is_a_safe_no_op(
    client: AsyncClient, db_session
) -> None:
    property_ = await _create_listed_property(db_session)
    token = await _login(client, "tenant3@example.com", "333333")
    headers = {"Authorization": f"Bearer {token}"}

    response = await client.delete(f"/api/v1/watchlist/{property_.id}", headers=headers)
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_watchlist_is_isolated_per_tenant(client: AsyncClient, db_session) -> None:
    """The bug being fixed: watchlists must not be shared across accounts."""
    property_ = await _create_listed_property(db_session)
    token_a = await _login(client, "tenant-a@example.com", "444444")
    token_b = await _login(client, "tenant-b@example.com", "555555")

    await client.post(
        "/api/v1/watchlist",
        json={"property_id": str(property_.id)},
        headers={"Authorization": f"Bearer {token_a}"},
    )

    a_list = await client.get("/api/v1/watchlist", headers={"Authorization": f"Bearer {token_a}"})
    b_list = await client.get("/api/v1/watchlist", headers={"Authorization": f"Bearer {token_b}"})

    assert len(a_list.json()["data"]) == 1
    assert len(b_list.json()["data"]) == 0

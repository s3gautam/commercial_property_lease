import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.property import Property, PropertyStatus


async def _create_property(
    session: AsyncSession, *, city: str = "Austin", status_: PropertyStatus = PropertyStatus.LISTED
) -> Property:
    property_ = Property(
        title="Downtown Office Suite",
        description="A bright office suite in the heart of downtown.",
        address="123 Main St",
        city=city,
        state="TX",
        country="USA",
        area_sqft=1200,
        monthly_rent=4500,
        status=status_,
    )
    session.add(property_)
    await session.commit()
    await session.refresh(property_)
    return property_


@pytest.fixture
async def db_session():
    from app.core.database import async_session_factory

    async with async_session_factory() as session:
        yield session


@pytest.mark.asyncio
async def test_browse_returns_only_listed_properties(client: AsyncClient, db_session) -> None:
    await _create_property(db_session, city="Austin", status_=PropertyStatus.LISTED)
    await _create_property(db_session, city="Austin", status_=PropertyStatus.DRAFT)

    response = await client.get("/api/v1/properties")
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert len(body["data"]) == 1
    assert body["data"][0]["status"] == "listed"
    assert body["meta"]["total"] == 1


@pytest.mark.asyncio
async def test_browse_filters_by_city(client: AsyncClient, db_session) -> None:
    await _create_property(db_session, city="Austin")
    await _create_property(db_session, city="Dallas")

    response = await client.get("/api/v1/properties", params={"city": "Dallas"})
    assert response.status_code == 200
    body = response.json()
    assert len(body["data"]) == 1
    assert body["data"][0]["city"] == "Dallas"


@pytest.mark.asyncio
async def test_browse_paginates(client: AsyncClient, db_session) -> None:
    for _ in range(3):
        await _create_property(db_session)

    response = await client.get("/api/v1/properties", params={"page": 1, "page_size": 2})
    body = response.json()
    assert len(body["data"]) == 2
    assert body["meta"]["total"] == 3

    response = await client.get("/api/v1/properties", params={"page": 2, "page_size": 2})
    body = response.json()
    assert len(body["data"]) == 1


@pytest.mark.asyncio
async def test_get_listed_property_by_id(client: AsyncClient, db_session) -> None:
    property_ = await _create_property(db_session)

    response = await client.get(f"/api/v1/properties/{property_.id}")
    assert response.status_code == 200
    assert response.json()["data"]["id"] == str(property_.id)


@pytest.mark.asyncio
async def test_get_draft_property_returns_404(client: AsyncClient, db_session) -> None:
    property_ = await _create_property(db_session, status_=PropertyStatus.DRAFT)

    response = await client.get(f"/api/v1/properties/{property_.id}")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_unknown_property_returns_404(client: AsyncClient) -> None:
    response = await client.get(f"/api/v1/properties/{uuid.uuid4()}")
    assert response.status_code == 404

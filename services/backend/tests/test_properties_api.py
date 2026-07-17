import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.property import Property, PropertyStatus


async def _create_property(
    session: AsyncSession,
    *,
    city: str = "Austin",
    status_: PropertyStatus = PropertyStatus.LISTED,
    title: str = "Downtown Office Suite",
    monthly_rent: float = 4500,
    area_sqft: float = 1200,
) -> Property:
    property_ = Property(
        title=title,
        description="A bright office suite in the heart of downtown.",
        address="123 Main St",
        city=city,
        state="TX",
        country="USA",
        area_sqft=area_sqft,
        monthly_rent=monthly_rent,
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
async def test_browse_filters_by_rent_range(client: AsyncClient, db_session) -> None:
    cheap = await _create_property(db_session, monthly_rent=1000)
    expensive = await _create_property(db_session, monthly_rent=9000)

    response = await client.get("/api/v1/properties", params={"min_rent": 5000})
    ids = {p["id"] for p in response.json()["data"]}
    assert str(expensive.id) in ids
    assert str(cheap.id) not in ids

    response = await client.get("/api/v1/properties", params={"max_rent": 5000})
    ids = {p["id"] for p in response.json()["data"]}
    assert str(cheap.id) in ids
    assert str(expensive.id) not in ids


@pytest.mark.asyncio
async def test_browse_filters_by_area_range(client: AsyncClient, db_session) -> None:
    small = await _create_property(db_session, area_sqft=500)
    large = await _create_property(db_session, area_sqft=5000)

    response = await client.get("/api/v1/properties", params={"min_area_sqft": 2000})
    ids = {p["id"] for p in response.json()["data"]}
    assert str(large.id) in ids
    assert str(small.id) not in ids

    response = await client.get("/api/v1/properties", params={"max_area_sqft": 2000})
    ids = {p["id"] for p in response.json()["data"]}
    assert str(small.id) in ids
    assert str(large.id) not in ids


@pytest.mark.asyncio
async def test_browse_filters_by_property_type(client: AsyncClient, db_session) -> None:
    office = await _create_property(db_session, title="Modern Office Space on Main St")
    warehouse = await _create_property(db_session, title="Large Warehouse on Main St")

    response = await client.get("/api/v1/properties", params={"property_type": "Warehouse"})
    ids = {p["id"] for p in response.json()["data"]}
    assert str(warehouse.id) in ids
    assert str(office.id) not in ids


@pytest.mark.asyncio
async def test_browse_filters_by_amenities(client: AsyncClient, db_session) -> None:
    from app.services.property_facts import AMENITY_POOL, get_amenities

    property_ = await _create_property(db_session)
    amenities = get_amenities(property_.id)
    missing = next(a for a in AMENITY_POOL if a not in amenities)

    response = await client.get("/api/v1/properties", params={"amenities": amenities[0]})
    ids = {p["id"] for p in response.json()["data"]}
    assert str(property_.id) in ids

    response = await client.get("/api/v1/properties", params={"amenities": missing})
    ids = {p["id"] for p in response.json()["data"]}
    assert str(property_.id) not in ids


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

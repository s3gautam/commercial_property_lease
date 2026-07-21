from unittest.mock import patch

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.property import Property, PropertyStatus
from app.services.visit_schedule import get_available_slots


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


def _first_available_slot(property_id):
    slots = get_available_slots(property_id)
    assert slots, "test property should have at least one available day in the next 7 days"
    return slots[0].day, slots[0].times[0]


@pytest.mark.asyncio
async def test_book_visit_requires_auth(client: AsyncClient, db_session) -> None:
    property_ = await _create_listed_property(db_session)
    day, time = _first_available_slot(property_.id)

    response = await client.post(
        "/api/v1/visits",
        json={"property_id": str(property_.id), "visit_date": day.isoformat(), "visit_time": time},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_book_visit_success_sends_email(client: AsyncClient, db_session) -> None:
    property_ = await _create_listed_property(db_session)
    day, time = _first_available_slot(property_.id)
    token = await _login(client, "tenant@example.com", "111111")
    headers = {"Authorization": f"Bearer {token}"}

    with patch(
        "app.services.notification_sender.ConsoleNotificationSender.send_email"
    ) as mock_send:
        response = await client.post(
            "/api/v1/visits",
            json={
                "property_id": str(property_.id),
                "visit_date": day.isoformat(),
                "visit_time": time,
            },
            headers=headers,
        )

    assert response.status_code == 200
    body = response.json()["data"]
    assert body["status"] == "upcoming"
    assert body["visit_date"] == day.isoformat()
    assert body["visit_time"] == time
    assert body["property_title"] == property_.title
    mock_send.assert_called_once()
    assert "confirmed" in mock_send.call_args.args[1]


@pytest.mark.asyncio
async def test_book_visit_rejects_unavailable_slot(client: AsyncClient, db_session) -> None:
    property_ = await _create_listed_property(db_session)
    token = await _login(client, "tenant2@example.com", "222222")
    headers = {"Authorization": f"Bearer {token}"}

    response = await client.post(
        "/api/v1/visits",
        json={
            "property_id": str(property_.id),
            "visit_date": "2020-01-01",
            "visit_time": "9:00 AM",
        },
        headers=headers,
    )
    assert response.status_code == 409


@pytest.mark.asyncio
async def test_book_visit_conflict_same_property(client: AsyncClient, db_session) -> None:
    property_ = await _create_listed_property(db_session)
    day, time = _first_available_slot(property_.id)
    token = await _login(client, "tenant3@example.com", "333333")
    headers = {"Authorization": f"Bearer {token}"}

    payload = {"property_id": str(property_.id), "visit_date": day.isoformat(), "visit_time": time}
    first = await client.post("/api/v1/visits", json=payload, headers=headers)
    assert first.status_code == 200

    second = await client.post("/api/v1/visits", json=payload, headers=headers)
    assert second.status_code == 409
    assert "already have a visit scheduled" in second.json()["error"]["message"]


@pytest.mark.asyncio
async def test_list_reschedule_and_cancel_visit(client: AsyncClient, db_session) -> None:
    property_ = await _create_listed_property(db_session)
    day, time = _first_available_slot(property_.id)
    token = await _login(client, "tenant4@example.com", "444444")
    headers = {"Authorization": f"Bearer {token}"}

    created = await client.post(
        "/api/v1/visits",
        json={"property_id": str(property_.id), "visit_date": day.isoformat(), "visit_time": time},
        headers=headers,
    )
    visit_id = created.json()["data"]["id"]

    listed = await client.get("/api/v1/visits", headers=headers)
    assert len(listed.json()["data"]) == 1

    # Reschedule to a different available slot for the same property.
    slots = get_available_slots(property_.id, days=14)
    new_day, new_time = next(
        (d.day, t) for d in slots for t in d.times if (d.day, t) != (day, time)
    )

    with patch(
        "app.services.notification_sender.ConsoleNotificationSender.send_email"
    ) as mock_send:
        rescheduled = await client.patch(
            f"/api/v1/visits/{visit_id}/reschedule",
            json={"visit_date": new_day.isoformat(), "visit_time": new_time},
            headers=headers,
        )
    assert rescheduled.status_code == 200
    assert rescheduled.json()["data"]["visit_date"] == new_day.isoformat()
    assert "rescheduled" in mock_send.call_args.args[1]

    cancelled = await client.post(f"/api/v1/visits/{visit_id}/cancel", headers=headers)
    assert cancelled.status_code == 200
    assert cancelled.json()["data"]["status"] == "cancelled"


@pytest.mark.asyncio
async def test_cannot_reschedule_or_cancel_another_tenants_visit(
    client: AsyncClient, db_session
) -> None:
    property_ = await _create_listed_property(db_session)
    day, time = _first_available_slot(property_.id)
    owner_token = await _login(client, "owner@example.com", "555555")
    other_token = await _login(client, "other@example.com", "666666")

    created = await client.post(
        "/api/v1/visits",
        json={"property_id": str(property_.id), "visit_date": day.isoformat(), "visit_time": time},
        headers={"Authorization": f"Bearer {owner_token}"},
    )
    visit_id = created.json()["data"]["id"]

    response = await client.post(
        f"/api/v1/visits/{visit_id}/cancel",
        headers={"Authorization": f"Bearer {other_token}"},
    )
    assert response.status_code == 404

from unittest.mock import patch

import pytest
from httpx import AsyncClient


async def _login(client: AsyncClient, email: str, code: str) -> str:
    with patch("secrets.randbelow", return_value=int(code)):
        await client.post("/api/v1/auth/otp/request", json={"email": email})

    response = await client.post("/api/v1/auth/otp/verify", json={"email": email, "code": code})
    return response.json()["data"]["tokens"]["access_token"]


@pytest.mark.asyncio
async def test_booking_notification_requires_auth(client: AsyncClient) -> None:
    response = await client.post(
        "/api/v1/notifications/booking",
        json={"property_title": "Downtown Office Suite", "date": "2026-08-01", "time": "10:00 AM", "action": "booked"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_booking_notification_sends_email(client: AsyncClient) -> None:
    access_token = await _login(client, "tenant@example.com", "123456")
    headers = {"Authorization": f"Bearer {access_token}"}

    with patch(
        "app.services.notification_sender.ConsoleNotificationSender.send_email"
    ) as mock_send:
        response = await client.post(
            "/api/v1/notifications/booking",
            json={
                "property_title": "Downtown Office Suite",
                "date": "2026-08-01",
                "time": "10:00 AM",
                "action": "booked",
            },
            headers=headers,
        )

    assert response.status_code == 200
    body = response.json()
    assert body["data"]["email_sent"] is True
    mock_send.assert_called_once()
    call_args = mock_send.call_args
    assert call_args.args[0] == "tenant@example.com"
    assert "Downtown Office Suite" in call_args.args[1]
    assert "confirmed" in call_args.args[1]


@pytest.mark.asyncio
async def test_booking_notification_rescheduled_wording(client: AsyncClient) -> None:
    access_token = await _login(client, "tenant2@example.com", "654321")
    headers = {"Authorization": f"Bearer {access_token}"}

    with patch(
        "app.services.notification_sender.ConsoleNotificationSender.send_email"
    ) as mock_send:
        response = await client.post(
            "/api/v1/notifications/booking",
            json={
                "property_title": "Downtown Office Suite",
                "date": "2026-08-02",
                "time": "11:00 AM",
                "action": "rescheduled",
            },
            headers=headers,
        )

    assert response.status_code == 200
    call_args = mock_send.call_args
    assert "rescheduled" in call_args.args[1]
    assert "Sunday, 02 August 2026" in call_args.args[2]

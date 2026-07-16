from unittest.mock import patch

import pytest
from httpx import AsyncClient


async def _login(client: AsyncClient, email: str, code: str) -> str:
    with patch("secrets.randbelow", return_value=int(code)):
        await client.post("/api/v1/auth/otp/request", json={"email": email})

    response = await client.post("/api/v1/auth/otp/verify", json={"email": email, "code": code})
    return response.json()["data"]["tokens"]["access_token"]


@pytest.mark.asyncio
async def test_get_profile_before_creation_returns_404(client: AsyncClient) -> None:
    access_token = await _login(client, "tenant-a@example.com", "111111")

    response = await client.get(
        "/api/v1/tenant-profile/me", headers={"Authorization": f"Bearer {access_token}"}
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_create_and_fetch_profile(client: AsyncClient) -> None:
    access_token = await _login(client, "tenant-b@example.com", "222222")
    headers = {"Authorization": f"Bearer {access_token}"}

    create_response = await client.put(
        "/api/v1/tenant-profile/me",
        json={"company_name": "Acme Corp", "business_type": "Retail"},
        headers=headers,
    )
    assert create_response.status_code == 200
    body = create_response.json()["data"]
    assert body["company_name"] == "Acme Corp"
    assert body["business_type"] == "Retail"

    get_response = await client.get("/api/v1/tenant-profile/me", headers=headers)
    assert get_response.status_code == 200
    assert get_response.json()["data"]["company_name"] == "Acme Corp"


@pytest.mark.asyncio
async def test_update_profile_overwrites_existing(client: AsyncClient) -> None:
    access_token = await _login(client, "tenant-c@example.com", "333333")
    headers = {"Authorization": f"Bearer {access_token}"}

    await client.put(
        "/api/v1/tenant-profile/me",
        json={"company_name": "First Name", "business_type": "Retail"},
        headers=headers,
    )
    response = await client.put(
        "/api/v1/tenant-profile/me",
        json={"company_name": "Second Name", "business_type": "Office"},
        headers=headers,
    )
    assert response.status_code == 200
    assert response.json()["data"]["company_name"] == "Second Name"


@pytest.mark.asyncio
async def test_profile_requires_authentication(client: AsyncClient) -> None:
    response = await client.get("/api/v1/tenant-profile/me")
    assert response.status_code == 401

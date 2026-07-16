from unittest.mock import patch

import pytest
from httpx import AsyncClient


async def _request_and_verify_otp(client: AsyncClient, email: str, code: str) -> dict:
    with patch("secrets.randbelow", return_value=int(code)):
        response = await client.post("/api/v1/auth/otp/request", json={"email": email})
    assert response.status_code == 200

    response = await client.post(
        "/api/v1/auth/otp/verify", json={"email": email, "code": code}
    )
    assert response.status_code == 200
    return response.json()


@pytest.mark.asyncio
async def test_otp_login_creates_user_and_issues_tokens(client: AsyncClient) -> None:
    body = await _request_and_verify_otp(client, "tenant@example.com", "654321")

    assert body["success"] is True
    assert body["data"]["user"]["email"] == "tenant@example.com"
    assert body["data"]["user"]["is_email_verified"] is True
    assert body["data"]["tokens"]["access_token"]
    assert body["data"]["tokens"]["refresh_token"]


@pytest.mark.asyncio
async def test_wrong_otp_code_is_rejected(client: AsyncClient) -> None:
    with patch("secrets.randbelow", return_value=111111):
        await client.post("/api/v1/auth/otp/request", json={"email": "tenant2@example.com"})

    response = await client.post(
        "/api/v1/auth/otp/verify", json={"email": "tenant2@example.com", "code": "000000"}
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_me_requires_valid_access_token(client: AsyncClient) -> None:
    body = await _request_and_verify_otp(client, "tenant3@example.com", "222222")
    access_token = body["data"]["tokens"]["access_token"]

    authenticated = await client.get(
        "/api/v1/auth/me", headers={"Authorization": f"Bearer {access_token}"}
    )
    assert authenticated.status_code == 200
    assert authenticated.json()["data"]["email"] == "tenant3@example.com"

    unauthenticated = await client.get("/api/v1/auth/me")
    assert unauthenticated.status_code == 401


@pytest.mark.asyncio
async def test_refresh_issues_new_token_pair(client: AsyncClient) -> None:
    body = await _request_and_verify_otp(client, "tenant4@example.com", "333333")
    refresh_token = body["data"]["tokens"]["refresh_token"]

    response = await client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert response.status_code == 200
    new_tokens = response.json()["data"]
    assert new_tokens["access_token"]
    assert new_tokens["refresh_token"]


@pytest.mark.asyncio
async def test_refresh_rejects_access_token(client: AsyncClient) -> None:
    body = await _request_and_verify_otp(client, "tenant5@example.com", "444444")
    access_token = body["data"]["tokens"]["access_token"]

    response = await client.post("/api/v1/auth/refresh", json={"refresh_token": access_token})
    assert response.status_code == 401

import os

os.environ.setdefault(
    "DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/proplease_test"
)
os.environ.setdefault("JWT_SECRET", "test-secret")
os.environ.setdefault("GOOGLE_CLIENT_ID", "test-google-client-id")

from collections.abc import AsyncIterator  # noqa: E402
from unittest.mock import patch  # noqa: E402

import pytest  # noqa: E402
import pytest_asyncio  # noqa: E402
import sqlalchemy as sa  # noqa: E402
from fakeredis.aioredis import FakeRedis  # noqa: E402
from httpx import ASGITransport, AsyncClient  # noqa: E402


@pytest.fixture
def fake_redis() -> FakeRedis:
    return FakeRedis()


@pytest_asyncio.fixture(autouse=True)
async def _clean_database() -> AsyncIterator[None]:
    yield

    from app.core.database import engine

    async with engine.begin() as conn:
        await conn.execute(
            sa.text(
                "TRUNCATE TABLE users, tenant_profiles, properties, property_images, "
                "property_documents, verification_reports, chat_threads, messages, "
                "leases, lease_versions, kyc_verifications, notifications, audit_logs, "
                "visits RESTART IDENTITY CASCADE"
            )
        )


@pytest_asyncio.fixture
async def client(fake_redis: FakeRedis) -> AsyncIterator[AsyncClient]:
    with (
        patch("app.api.deps.get_redis", return_value=fake_redis),
        patch("app.core.rate_limit.get_redis", return_value=fake_redis),
    ):
        from app.main import app

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as async_client:
            yield async_client

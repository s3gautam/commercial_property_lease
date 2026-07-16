"""One-off script to seed dummy LISTED properties for manual testing.

Usage (against local Docker Compose DB):
    cd services/backend && python -m scripts.seed_properties

Usage (against a deployed environment, e.g. Railway):
    railway run --service <backend-service-name> python -m scripts.seed_properties

See also: GET /api/v1/admin/seed-properties, a token-gated HTTP
equivalent for triggering this from a browser without CLI/DB access.
"""

import asyncio

from app.core.database import async_session_factory
from app.repositories.property_repository import PropertyRepository
from app.services.property_seed_service import seed_dummy_properties


async def seed(count: int = 35) -> None:
    async with async_session_factory() as session:
        seeded = await seed_dummy_properties(PropertyRepository(session), count)
        await session.commit()
    print(f"Seeded {seeded} listed properties.")


if __name__ == "__main__":
    asyncio.run(seed())

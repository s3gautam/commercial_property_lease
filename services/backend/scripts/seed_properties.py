"""One-off script to seed dummy LISTED properties for manual testing.

Usage (against local Docker Compose DB):
    cd services/backend && python -m scripts.seed_properties

Usage (against a deployed environment, e.g. Railway):
    railway run --service <backend-service-name> python -m scripts.seed_properties
"""

import asyncio
import random

from app.core.database import async_session_factory
from app.models.property import Property, PropertyStatus

CITIES = [
    ("Bengaluru", "Karnataka"),
    ("Mumbai", "Maharashtra"),
    ("Pune", "Maharashtra"),
    ("Hyderabad", "Telangana"),
    ("Chennai", "Tamil Nadu"),
    ("Delhi", "Delhi"),
    ("Gurugram", "Haryana"),
    ("Noida", "Uttar Pradesh"),
    ("Kolkata", "West Bengal"),
    ("Ahmedabad", "Gujarat"),
]

PROPERTY_TYPES = [
    "Office Space",
    "Retail Storefront",
    "Warehouse",
    "Co-working Suite",
    "Showroom",
    "Industrial Unit",
    "Corporate Campus Floor",
]

STREETS = [
    "MG Road",
    "Brigade Road",
    "Linking Road",
    "Park Street",
    "Anna Salai",
    "Sector 18",
    "Cyber City",
    "SG Highway",
    "Koramangala 5th Block",
    "Banjara Hills",
]


async def seed(count: int = 35) -> None:
    async with async_session_factory() as session:
        for i in range(1, count + 1):
            city, state = random.choice(CITIES)
            property_type = random.choice(PROPERTY_TYPES)
            street = random.choice(STREETS)
            area = random.randint(500, 15000)
            rent = round(area * random.uniform(25, 120), 2)

            session.add(
                Property(
                    title=f"{property_type} on {street}, {city} #{i}",
                    description=(
                        f"A {area} sq ft {property_type.lower()} located on {street}, "
                        f"{city}. Move-in ready with modern amenities, close to public "
                        "transport and major business hubs."
                    ),
                    address=f"{random.randint(1, 999)} {street}",
                    city=city,
                    state=state,
                    country="India",
                    area_sqft=area,
                    monthly_rent=rent,
                    status=PropertyStatus.LISTED,
                )
            )

        await session.commit()
    print(f"Seeded {count} listed properties.")


if __name__ == "__main__":
    asyncio.run(seed())

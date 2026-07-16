"""Generates randomized dummy LISTED properties for manual testing. Shared
by the one-off seed script (scripts/seed_properties.py) and the guarded
admin endpoint (app/api/v1/admin.py) so the data doesn't drift between the
two entry points."""

import random

from app.models.property import Property, PropertyStatus
from app.repositories.property_repository import PropertyRepository

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


def _build_dummy_property(index: int) -> Property:
    city, state = random.choice(CITIES)
    property_type = random.choice(PROPERTY_TYPES)
    street = random.choice(STREETS)
    area = random.randint(500, 15000)
    rent = round(area * random.uniform(25, 120), 2)

    return Property(
        title=f"{property_type} on {street}, {city} #{index}",
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


async def seed_dummy_properties(properties: PropertyRepository, count: int) -> int:
    for i in range(1, count + 1):
        await properties.create(_build_dummy_property(i))
    return count

"""Deterministic amenities and nearby-landmark facts for a listing.

There's no real data source for either yet (no admin UI to enter
amenities, no geocoding/places integration for real distances), so both
are derived deterministically from the property's id and city - the same
property always shows the same amenities and distances. This is
presentation filler, but it's also fed into LandlordChatAgent's prompt
as ground truth the agent is allowed to state as fact, which is why it
lives in `services` rather than purely in a frontend util: the backend
is the single source of truth for what the "listing" and the chat agent
both know.
"""

import hashlib
import uuid
from dataclasses import dataclass

AMENITY_POOL = [
    "Reserved parking",
    "High-speed WiFi",
    "24/7 power backup",
    "24/7 security",
    "CCTV surveillance",
    "Central air conditioning",
    "Conference room",
    "Pantry / cafeteria",
    "Elevator access",
    "Wheelchair accessible",
    "Fire safety system",
    "Reception desk",
    "On-site cafe",
    "Printer / scanning facility",
    "Waste disposal service",
    "Freight elevator",
    "Bike parking",
    "On-site gym",
]

LANDMARK_TYPES = ["Bus Stand", "Airport", "Metro Station", "Hospital", "Shopping Mall"]


@dataclass
class NearbyLandmark:
    label: str
    name: str
    distance_km: float


def _seeded_random(*parts: str) -> "_DeterministicSequence":
    digest = hashlib.sha256("|".join(parts).encode()).hexdigest()
    return _DeterministicSequence(int(digest, 16))


class _DeterministicSequence:
    """Tiny linear-congruential generator so this module has no extra
    dependency on Python's `random.Random` seeding behavior across
    versions - just needs to be stable and cheap."""

    def __init__(self, seed: int) -> None:
        self._state = seed

    def next(self) -> float:
        self._state = (self._state * 6364136223846793005 + 1) & ((1 << 64) - 1)
        return self._state / (1 << 64)

    def next_range(self, low: float, high: float) -> float:
        return low + self.next() * (high - low)


def get_amenities(property_id: uuid.UUID) -> list[str]:
    rng = _seeded_random(str(property_id), "amenities")
    count = 6 + int(rng.next_range(0, 5))  # 6-10 amenities
    pool = list(AMENITY_POOL)
    selected: list[str] = []
    for _ in range(count):
        if not pool:
            break
        index = int(rng.next() * len(pool))
        selected.append(pool.pop(index))
    return selected


def get_nearby_landmarks(property_id: uuid.UUID, city: str) -> list[NearbyLandmark]:
    landmarks = []
    for landmark_type in LANDMARK_TYPES:
        rng = _seeded_random(str(property_id), landmark_type)
        distance_km = round(rng.next_range(0.4, 12.0), 1)
        name = f"{city} {landmark_type}"
        landmarks.append(NearbyLandmark(label=landmark_type, name=name, distance_km=distance_km))
    return sorted(landmarks, key=lambda item: item.distance_km)

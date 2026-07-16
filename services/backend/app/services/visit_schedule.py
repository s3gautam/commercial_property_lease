"""Deterministic visit-slot availability, mirroring
apps/web/lib/property-schedule.ts exactly (same hash function, same time
list, same ~70% availability threshold, same closed-Sunday rule) so a
landlord's chat reply and the calendar UI never disagree about what's
actually open. There's no real landlord calendar yet - this is filler,
same caveat as amenities/nearby landmarks (app/services/property_facts.py).
"""

import uuid
from dataclasses import dataclass
from datetime import date, timedelta

ALL_TIMES = [
    "9:00 AM",
    "10:00 AM",
    "11:00 AM",
    "12:00 PM",
    "1:00 PM",
    "2:00 PM",
    "3:00 PM",
    "4:00 PM",
    "5:00 PM",
]


def _hash_string(value: str) -> int:
    # Matches apps/web/lib/property-schedule.ts::hashString exactly - a
    # 32-bit polynomial hash, so the same property id + date always
    # produces the same result in both TypeScript and Python.
    h = 0
    for ch in value:
        h = (h * 31 + ord(ch)) & 0xFFFFFFFF
    return h


def is_closed_day(d: date) -> bool:
    return d.weekday() == 6  # Sunday; Python Monday=0..Sunday=6


@dataclass
class DaySlots:
    day: date
    times: list[str]


def get_available_slots(property_id: uuid.UUID, days: int = 7) -> list[DaySlots]:
    """Available (not "booked") slots for the next `days` days, skipping
    closed days and days with no open slots."""
    today = date.today()
    result: list[DaySlots] = []

    for offset in range(days):
        day = today + timedelta(days=offset)
        if is_closed_day(day):
            continue

        seed = _hash_string(f"{property_id}-{day.isoformat()}")
        times = [time for index, time in enumerate(ALL_TIMES) if (seed + index * 13) % 10 < 7]
        if times:
            result.append(DaySlots(day=day, times=times))

    return result


def is_slot_available(property_id: uuid.UUID, day: date, time: str) -> bool:
    if is_closed_day(day):
        return False
    seed = _hash_string(f"{property_id}-{day.isoformat()}")
    try:
        index = ALL_TIMES.index(time)
    except ValueError:
        return False
    return (seed + index * 13) % 10 < 7

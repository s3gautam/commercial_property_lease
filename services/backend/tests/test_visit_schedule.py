import uuid
from datetime import date

from app.services.visit_schedule import get_available_slots, is_closed_day, is_slot_available


def test_available_slots_are_deterministic() -> None:
    property_id = uuid.uuid4()
    assert get_available_slots(property_id) == get_available_slots(property_id)


def test_available_slots_skip_sundays() -> None:
    property_id = uuid.uuid4()
    for day_slots in get_available_slots(property_id, days=14):
        assert not is_closed_day(day_slots.day)


def test_is_slot_available_matches_get_available_slots() -> None:
    property_id = uuid.uuid4()
    for day_slots in get_available_slots(property_id, days=14):
        for time in day_slots.times:
            assert is_slot_available(property_id, day_slots.day, time)


def test_is_slot_available_false_for_unknown_time() -> None:
    property_id = uuid.uuid4()
    day = date.today()
    assert is_slot_available(property_id, day, "not a real time") is False


def test_is_closed_day_is_sunday() -> None:
    # 2026-07-19 is a Sunday
    assert is_closed_day(date(2026, 7, 19)) is True
    assert is_closed_day(date(2026, 7, 20)) is False

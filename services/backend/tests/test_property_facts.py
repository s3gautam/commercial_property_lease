import uuid

from app.services.property_facts import get_amenities, get_nearby_landmarks


def test_amenities_are_deterministic_per_property() -> None:
    property_id = uuid.uuid4()
    assert get_amenities(property_id) == get_amenities(property_id)


def test_amenities_differ_across_properties() -> None:
    assert get_amenities(uuid.uuid4()) != get_amenities(uuid.uuid4())


def test_amenities_have_no_duplicates_and_reasonable_count() -> None:
    amenities = get_amenities(uuid.uuid4())
    assert 6 <= len(amenities) <= 10
    assert len(amenities) == len(set(amenities))


def test_nearby_landmarks_are_deterministic_and_sorted_by_distance() -> None:
    property_id = uuid.uuid4()
    landmarks = get_nearby_landmarks(property_id, "Pune")

    assert landmarks == get_nearby_landmarks(property_id, "Pune")
    distances = [lm.distance_km for lm in landmarks]
    assert distances == sorted(distances)
    assert all(lm.name.startswith("Pune ") for lm in landmarks)


def test_nearby_landmarks_cover_all_five_types() -> None:
    landmarks = get_nearby_landmarks(uuid.uuid4(), "Austin")
    labels = {lm.label for lm in landmarks}
    assert labels == {"Bus Stand", "Airport", "Metro Station", "Hospital", "Shopping Mall"}

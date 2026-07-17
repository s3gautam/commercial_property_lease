// Mirrors services/backend/app/services/property_seed_service.py::PROPERTY_TYPES
// and app/services/property_facts.py::AMENITY_POOL so the browse filters
// only ever offer options the backend can actually match.

export const PROPERTY_TYPES = [
  "Office Space",
  "Retail Storefront",
  "Warehouse",
  "Co-working Suite",
  "Showroom",
  "Industrial Unit",
  "Corporate Campus Floor",
];

export const AMENITY_OPTIONS = [
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
];

// Listings have no real photos yet (PropertyImage exists on the backend
// but nothing populates it) - these are deterministic placeholders keyed
// by property id so the same listing always shows the same "photo" and
// map pin, purely for demo purposes.

export function propertyImageUrl(propertyId: string, width = 640, height = 400): string {
  return `https://picsum.photos/seed/${encodeURIComponent(propertyId)}/${width}/${height}`;
}

export function propertyMapEmbedUrl(property: {
  address: string;
  city: string;
  state: string;
  country: string;
}): string {
  const query = `${property.address}, ${property.city}, ${property.state}, ${property.country}`;
  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
}

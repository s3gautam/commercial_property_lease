// Listings have no real photos yet (PropertyImage exists on the backend
// but nothing populates it). Photos are keyword-filtered real photos from
// LoremFlickr (not random unrelated stock images like plain picsum.photos)
// so a "Warehouse" listing actually shows a warehouse, an "Office Space"
// shows an office building, etc. - matched by keywords in the title, with
// a generic commercial-building fallback. LoremFlickr's `lock` parameter
// pins a specific photo for a given seed, so the same property always
// shows the same "photo", purely for demo purposes.

type PropertyCategory = "office" | "warehouse" | "retail";

const CATEGORY_KEYWORDS: Record<PropertyCategory, string> = {
  office: "office,building,corporate",
  warehouse: "warehouse,industrial,storage",
  retail: "storefront,retailstore,shop",
};

const GENERIC_KEYWORDS = "commercialbuilding,realestate";

function detectCategory(title: string): PropertyCategory | null {
  const lower = title.toLowerCase();
  if (/warehouse|industrial/.test(lower)) return "warehouse";
  if (/retail|storefront|showroom|shop/.test(lower)) return "retail";
  if (/office|corporate|co-working|coworking/.test(lower)) return "office";
  return null;
}

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  return hash;
}

export function propertyImageUrl(
  property: { id: string; title: string },
  width = 640,
  height = 400,
): string {
  const category = detectCategory(property.title);
  const keywords = category ? CATEGORY_KEYWORDS[category] : GENERIC_KEYWORDS;
  const lock = hashString(property.id) % 100000;
  return `https://loremflickr.com/${width}/${height}/${keywords}?lock=${lock}`;
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

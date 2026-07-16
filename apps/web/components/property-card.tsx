import { MapPin, Ruler } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import type { ApiProperty } from "@/lib/api/types";
import { propertyImageUrl } from "@/lib/property-image";

const rentFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function PropertyCard({
  property,
  animationDelayMs = 0,
}: {
  property: ApiProperty;
  animationDelayMs?: number;
}) {
  return (
    <Link
      href={`/properties/${property.id}`}
      className="animate-fade-up group overflow-hidden rounded-2xl border border-border bg-surface shadow-soft transition-all hover:-translate-y-1 hover:shadow-card-hover"
      style={{ animationDelay: `${animationDelayMs}ms` }}
    >
      <div className="relative h-36 overflow-hidden bg-surface-2">
        <Image
          src={propertyImageUrl(property.id)}
          alt=""
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium capitalize text-black shadow-soft backdrop-blur">
          {property.status}
        </span>
      </div>

      <div className="flex flex-col gap-2 p-4">
        <h2 className="line-clamp-1 font-medium tracking-tight">{property.title}</h2>
        <p className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" strokeWidth={2} />
          {property.city}, {property.state}
        </p>
        <div className="mt-1 flex items-center justify-between">
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Ruler className="h-3.5 w-3.5" strokeWidth={2} />
            {property.area_sqft.toLocaleString()} sqft
          </p>
          <p className="font-semibold text-gradient">
            {rentFormatter.format(property.monthly_rent)}
            <span className="text-xs font-normal text-muted-foreground">/mo</span>
          </p>
        </div>
      </div>
    </Link>
  );
}

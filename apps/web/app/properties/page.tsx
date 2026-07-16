"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, MapPin, Ruler, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { apiClient } from "@/lib/api/client";
import type { ApiProperty } from "@/lib/api/types";
import { propertyImageUrl } from "@/lib/property-image";

const rentFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const PAGE_SIZE = 20;

export default function PropertiesPage() {
  const [page, setPage] = useState(1);
  const [city, setCity] = useState("");

  const propertiesQuery = useQuery({
    queryKey: ["properties", page, city],
    queryFn: () =>
      apiClient.get<ApiProperty[]>(
        `/properties?page=${page}&page_size=${PAGE_SIZE}${city ? `&city=${encodeURIComponent(city)}` : ""}`,
      ),
  });

  const properties = propertiesQuery.data?.data ?? [];
  const total = (propertiesQuery.data?.meta?.total as number | undefined) ?? 0;
  const hasNextPage = page * PAGE_SIZE < total;

  return (
    <main className="mx-auto max-w-6xl px-6 py-14">
      <div className="mb-8 flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Browse properties</h1>
        <p className="text-muted-foreground">
          Commercial spaces available to lease right now{total > 0 ? ` — ${total} listed` : ""}.
        </p>
      </div>

      <div className="relative mb-8 max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={city}
          onChange={(event) => {
            setCity(event.target.value);
            setPage(1);
          }}
          placeholder="Filter by city…"
          className="w-full rounded-full border border-border bg-surface py-2.5 pl-9 pr-4 text-sm shadow-soft outline-none transition-shadow focus:shadow-glow"
        />
      </div>

      {propertiesQuery.isLoading && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="overflow-hidden rounded-2xl border border-border bg-surface">
              <div className="h-32 animate-pulse bg-surface-2" />
              <div className="space-y-2 p-4">
                <div className="h-4 w-3/4 animate-pulse rounded bg-surface-2" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-surface-2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {propertiesQuery.isSuccess && properties.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center text-muted-foreground">
          No properties match your search yet.
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {properties.map((property, index) => (
          <Link
            key={property.id}
            href={`/properties/${property.id}`}
            className="animate-fade-up group overflow-hidden rounded-2xl border border-border bg-surface shadow-soft transition-all hover:-translate-y-1 hover:shadow-card-hover"
            style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
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
        ))}
      </div>

      {total > PAGE_SIZE && (
        <div className="mt-10 flex items-center justify-center gap-3">
          <button
            type="button"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="flex items-center gap-1 rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium shadow-soft transition-colors hover:bg-surface-2 disabled:pointer-events-none disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </button>
          <span className="text-sm text-muted-foreground">Page {page}</span>
          <button
            type="button"
            disabled={!hasNextPage}
            onClick={() => setPage((p) => p + 1)}
            className="flex items-center gap-1 rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium shadow-soft transition-colors hover:bg-surface-2 disabled:pointer-events-none disabled:opacity-40"
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </main>
  );
}

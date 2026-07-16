"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useState } from "react";

import { PropertyCard } from "@/components/property-card";
import { apiClient } from "@/lib/api/client";
import type { ApiProperty } from "@/lib/api/types";

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
          <PropertyCard
            key={property.id}
            property={property}
            animationDelayMs={Math.min(index, 8) * 40}
          />
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

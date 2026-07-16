"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

import { apiClient } from "@/lib/api/client";
import type { ApiProperty } from "@/lib/api/types";

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
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-8 flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Browse properties</h1>
        <p className="text-muted-foreground">
          Commercial spaces available to lease right now.
        </p>
      </div>

      <input
        value={city}
        onChange={(event) => {
          setCity(event.target.value);
          setPage(1);
        }}
        placeholder="Filter by city…"
        className="mb-8 w-full max-w-xs rounded-md border border-border bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
      />

      {propertiesQuery.isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-40 animate-pulse rounded-lg border border-border bg-black/5 dark:bg-white/5"
            />
          ))}
        </div>
      )}

      {propertiesQuery.isSuccess && properties.length === 0 && (
        <p className="text-muted-foreground">No properties match your search yet.</p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {properties.map((property) => (
          <Link
            key={property.id}
            href={`/properties/${property.id}`}
            className="flex flex-col gap-2 rounded-lg border border-border p-4 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
          >
            <h2 className="font-medium">{property.title}</h2>
            <p className="text-sm text-muted-foreground">
              {property.city}, {property.state}
            </p>
            <p className="text-sm font-medium">
              {rentFormatter.format(property.monthly_rent)}/mo
            </p>
          </Link>
        ))}
      </div>

      {total > PAGE_SIZE && (
        <div className="mt-8 flex items-center gap-4">
          <button
            type="button"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-md border border-border px-3 py-1.5 text-sm disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-muted-foreground">Page {page}</span>
          <button
            type="button"
            disabled={!hasNextPage}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-md border border-border px-3 py-1.5 text-sm disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </main>
  );
}

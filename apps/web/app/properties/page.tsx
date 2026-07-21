"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  Globe2,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import { useState } from "react";

import { PropertyCard } from "@/components/property-card";
import { apiClient } from "@/lib/api/client";
import type { ApiProperty, ApiPropertySearchResponse } from "@/lib/api/types";
import { AMENITY_OPTIONS, PROPERTY_TYPES } from "@/lib/property-options";

const PAGE_SIZE = 20;

export default function PropertiesPage() {
  const [page, setPage] = useState(1);
  const [city, setCity] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [aiQuery, setAiQuery] = useState("");

  const aiSearch = useMutation({
    mutationFn: (q: string) =>
      apiClient.get<ApiPropertySearchResponse>(`/properties/search?q=${encodeURIComponent(q)}`),
  });
  const aiResults = aiSearch.data?.data;
  const clearAiSearch = () => {
    setAiQuery("");
    aiSearch.reset();
  };

  const [minRent, setMinRent] = useState("");
  const [maxRent, setMaxRent] = useState("");
  const [minArea, setMinArea] = useState("");
  const [maxArea, setMaxArea] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [amenities, setAmenities] = useState<string[]>([]);

  const resetToFirstPage = () => setPage(1);

  const toggleAmenity = (amenity: string) => {
    setAmenities((current) =>
      current.includes(amenity) ? current.filter((a) => a !== amenity) : [...current, amenity],
    );
    resetToFirstPage();
  };

  const clearFilters = () => {
    setMinRent("");
    setMaxRent("");
    setMinArea("");
    setMaxArea("");
    setPropertyType("");
    setAmenities([]);
    resetToFirstPage();
  };

  const activeFilterCount =
    (minRent ? 1 : 0) +
    (maxRent ? 1 : 0) +
    (minArea ? 1 : 0) +
    (maxArea ? 1 : 0) +
    (propertyType ? 1 : 0) +
    amenities.length;

  const queryParams = new URLSearchParams();
  queryParams.set("page", String(page));
  queryParams.set("page_size", String(PAGE_SIZE));
  if (city) queryParams.set("city", city);
  if (minRent) queryParams.set("min_rent", minRent);
  if (maxRent) queryParams.set("max_rent", maxRent);
  if (minArea) queryParams.set("min_area_sqft", minArea);
  if (maxArea) queryParams.set("max_area_sqft", maxArea);
  if (propertyType) queryParams.set("property_type", propertyType);
  if (amenities.length > 0) queryParams.set("amenities", amenities.join(","));

  const propertiesQuery = useQuery({
    queryKey: [
      "properties",
      page,
      city,
      minRent,
      maxRent,
      minArea,
      maxArea,
      propertyType,
      amenities,
    ],
    queryFn: () => apiClient.get<ApiProperty[]>(`/properties?${queryParams.toString()}`),
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

      <div className="mb-6 rounded-2xl border-2 border-accent/30 bg-surface p-4 shadow-soft sm:p-5">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-gradient text-white shadow-glow">
            <Sparkles className="h-4 w-4" strokeWidth={2.25} />
          </span>
          <div>
            <p className="text-sm font-semibold tracking-tight">AI Search</p>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Globe2 className="h-3 w-3" strokeWidth={2} />
              Type in any language — Hindi, Tamil, English, or however you&apos;d ask a person
            </p>
          </div>
        </div>
        <form
          className="mt-3 flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (aiQuery.trim()) aiSearch.mutate(aiQuery);
          }}
        >
          <input
            value={aiQuery}
            onChange={(event) => setAiQuery(event.target.value)}
            placeholder="e.g. पुणे में ₹50,000 से कम किराए पर ऑफिस स्पेस"
            className="flex-1 rounded-full border border-border bg-background px-4 py-2.5 text-sm outline-none transition-shadow focus:shadow-glow"
          />
          <button
            type="submit"
            disabled={aiSearch.isPending || !aiQuery.trim()}
            className="rounded-full bg-accent-gradient px-5 py-2.5 text-sm font-medium text-white shadow-glow transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
          >
            {aiSearch.isPending ? "Searching…" : "Search"}
          </button>
          {aiResults && (
            <button
              type="button"
              onClick={clearAiSearch}
              className="flex items-center gap-1 whitespace-nowrap rounded-full border border-border bg-surface px-4 py-2.5 text-sm font-medium transition-colors hover:bg-surface-2"
            >
              <X className="h-3.5 w-3.5" />
              Clear
            </button>
          )}
        </form>

        {aiSearch.isError && (
          <p className="mt-3 text-sm text-danger">
            Something went wrong running that search. Please try again.
          </p>
        )}

        {aiResults?.criteria.explanation && (
          <p className="mt-3 rounded-xl bg-surface-2 px-4 py-2.5 text-sm text-muted-foreground">
            {aiResults.criteria.explanation}
          </p>
        )}
      </div>

      {aiResults ? (
        <>
          {aiResults.properties.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border py-16 text-center text-muted-foreground">
              No properties matched that search.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {aiResults.properties.map((property, index) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  animationDelayMs={Math.min(index, 8) * 40}
                />
              ))}
            </div>
          )}
        </>
      ) : (
      <>
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <div className="relative max-w-xs flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={city}
            onChange={(event) => {
              setCity(event.target.value);
              resetToFirstPage();
            }}
            placeholder="Filter by city…"
            className="w-full rounded-full border border-border bg-surface py-2.5 pl-9 pr-4 text-sm shadow-soft outline-none transition-shadow focus:shadow-glow"
          />
        </div>

        <button
          type="button"
          onClick={() => setFiltersOpen((open) => !open)}
          className="flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2.5 text-sm font-medium shadow-soft transition-colors hover:bg-surface-2"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-foreground px-1.5 text-xs font-semibold text-background">
              {activeFilterCount}
            </span>
          )}
        </button>

        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={clearFilters}
            className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
            Clear filters
          </button>
        )}
      </div>

      {filtersOpen && (
        <div className="mb-8 rounded-2xl border border-border bg-surface p-5 shadow-soft">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Rent range (₹/mo)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  value={minRent}
                  onChange={(event) => {
                    setMinRent(event.target.value);
                    resetToFirstPage();
                  }}
                  placeholder="Min"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:shadow-glow"
                />
                <span className="text-muted-foreground">–</span>
                <input
                  type="number"
                  min={0}
                  value={maxRent}
                  onChange={(event) => {
                    setMaxRent(event.target.value);
                    resetToFirstPage();
                  }}
                  placeholder="Max"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:shadow-glow"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Area range (sqft)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  value={minArea}
                  onChange={(event) => {
                    setMinArea(event.target.value);
                    resetToFirstPage();
                  }}
                  placeholder="Min"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:shadow-glow"
                />
                <span className="text-muted-foreground">–</span>
                <input
                  type="number"
                  min={0}
                  value={maxArea}
                  onChange={(event) => {
                    setMaxArea(event.target.value);
                    resetToFirstPage();
                  }}
                  placeholder="Max"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:shadow-glow"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Property type
              </label>
              <select
                value={propertyType}
                onChange={(event) => {
                  setPropertyType(event.target.value);
                  resetToFirstPage();
                }}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:shadow-glow"
              >
                <option value="">Any type</option>
                {PROPERTY_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2 lg:col-span-1">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Amenities
              </label>
              <div className="flex max-h-40 flex-wrap gap-x-3 gap-y-2 overflow-y-auto pr-1 text-sm">
                {AMENITY_OPTIONS.map((amenity) => (
                  <label key={amenity} className="flex items-center gap-1.5 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={amenities.includes(amenity)}
                      onChange={() => toggleAmenity(amenity)}
                      className="h-3.5 w-3.5 rounded border-border accent-foreground"
                    />
                    {amenity}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

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
      </>
      )}
    </main>
  );
}

"use client";

import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client";
import type { ApiProperty } from "@/lib/api/types";

import { PropertyCard } from "./property-card";

const RECOMMENDATION_COUNT = 3;

export function RecommendedProperties({ current }: { current: ApiProperty }) {
  const sameCityQuery = useQuery({
    queryKey: ["properties", "recommendations", current.city],
    queryFn: () =>
      apiClient.get<ApiProperty[]>(
        `/properties?page=1&page_size=${RECOMMENDATION_COUNT + 1}&city=${encodeURIComponent(current.city)}`,
      ),
  });

  const fallbackQuery = useQuery({
    queryKey: ["properties", "recommendations", "fallback"],
    queryFn: () => apiClient.get<ApiProperty[]>(`/properties?page=1&page_size=${RECOMMENDATION_COUNT + 1}`),
    enabled:
      sameCityQuery.isSuccess &&
      (sameCityQuery.data?.data ?? []).filter((p) => p.id !== current.id).length === 0,
  });

  const candidates = (sameCityQuery.data?.data?.length ? sameCityQuery.data.data : fallbackQuery.data?.data) ?? [];
  const recommendations = candidates.filter((p) => p.id !== current.id).slice(0, RECOMMENDATION_COUNT);

  const isLoading = sameCityQuery.isLoading || (sameCityQuery.isSuccess && fallbackQuery.isLoading);

  if (!isLoading && recommendations.length === 0) return null;

  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold tracking-tight">You might also like</h2>

      {isLoading ? (
        <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="overflow-hidden rounded-2xl border border-border bg-surface">
              <div className="h-36 animate-pulse bg-surface-2" />
              <div className="space-y-2 p-4">
                <div className="h-4 w-3/4 animate-pulse rounded bg-surface-2" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-surface-2" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {recommendations.map((property, index) => (
            <PropertyCard key={property.id} property={property} animationDelayMs={index * 40} />
          ))}
        </div>
      )}
    </section>
  );
}

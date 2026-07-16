"use client";

import { useMutation } from "@tanstack/react-query";
import { MapPin, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { apiClient } from "@/lib/api/client";
import type { ApiPropertySearchResponse } from "@/lib/api/types";
import { propertyImageUrl } from "@/lib/property-image";

const rentFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export default function SearchPage() {
  const [query, setQuery] = useState("");

  const search = useMutation({
    mutationFn: (q: string) =>
      apiClient.get<ApiPropertySearchResponse>(`/properties/search?q=${encodeURIComponent(q)}`),
  });

  const results = search.data?.data;

  return (
    <main className="bg-mesh min-h-[calc(100vh-65px)] px-6 py-14">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-gradient text-white shadow-glow">
            <Sparkles className="h-5 w-5" strokeWidth={2.25} />
          </span>
          <h1 className="text-3xl font-semibold tracking-tight">AI Search</h1>
          <p className="mt-1.5 text-muted-foreground">
            Describe the space you need in plain language.
          </p>
        </div>

        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (query.trim()) search.mutate(query);
          }}
        >
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="e.g. office space in Austin under $5000"
            className="flex-1 rounded-full border border-border bg-surface px-4 py-3 text-sm shadow-soft outline-none transition-shadow focus:shadow-glow"
          />
          <button
            type="submit"
            disabled={search.isPending || !query.trim()}
            className="rounded-full bg-accent-gradient px-5 py-3 text-sm font-medium text-white shadow-glow transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
          >
            {search.isPending ? "Searching…" : "Search"}
          </button>
        </form>

        {search.isError && (
          <p className="mt-6 text-center text-sm text-danger">
            Something went wrong running that search. Please try again.
          </p>
        )}

        {results && (
          <div className="mt-10">
            {results.criteria.explanation && (
              <p className="mb-6 rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-muted-foreground shadow-soft">
                {results.criteria.explanation}
              </p>
            )}

            {results.properties.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border py-16 text-center text-muted-foreground">
                No properties matched that search.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {results.properties.map((property) => (
                  <Link
                    key={property.id}
                    href={`/properties/${property.id}`}
                    className="flex gap-3 overflow-hidden rounded-2xl border border-border bg-surface p-3 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
                  >
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-surface-2">
                      <Image
                        src={propertyImageUrl(property.id, 160, 160)}
                        alt=""
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex flex-col justify-center gap-1">
                      <h2 className="line-clamp-1 font-medium tracking-tight">{property.title}</h2>
                      <p className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" strokeWidth={2} />
                        {property.city}, {property.state}
                      </p>
                      <p className="font-semibold text-gradient">
                        {rentFormatter.format(property.monthly_rent)}
                        <span className="text-xs font-normal text-muted-foreground">/mo</span>
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

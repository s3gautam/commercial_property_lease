"use client";

import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

import { apiClient } from "@/lib/api/client";
import type { ApiPropertySearchResponse } from "@/lib/api/types";

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
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">AI Search</h1>
        <p className="mt-1 text-muted-foreground">
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
          className="flex-1 rounded-md border border-border bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
        />
        <button
          type="submit"
          disabled={search.isPending || !query.trim()}
          className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
        >
          {search.isPending ? "Searching…" : "Search"}
        </button>
      </form>

      {search.isError && (
        <p className="mt-6 text-sm text-red-500">
          Something went wrong running that search. Please try again.
        </p>
      )}

      {results && (
        <div className="mt-8">
          {results.criteria.explanation && (
            <p className="mb-6 text-sm text-muted-foreground">{results.criteria.explanation}</p>
          )}

          {results.properties.length === 0 ? (
            <p className="text-muted-foreground">No properties matched that search.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {results.properties.map((property) => (
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
          )}
        </div>
      )}
    </main>
  );
}

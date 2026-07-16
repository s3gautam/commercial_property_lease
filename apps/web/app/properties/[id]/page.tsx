"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";

import { apiClient } from "@/lib/api/client";
import type { ApiProperty } from "@/lib/api/types";

const rentFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export default function PropertyDetailPage() {
  const params = useParams<{ id: string }>();

  const propertyQuery = useQuery({
    queryKey: ["properties", params.id],
    queryFn: () => apiClient.get<ApiProperty>(`/properties/${params.id}`),
  });

  if (propertyQuery.isLoading) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-12">
        <div className="h-8 w-2/3 animate-pulse rounded bg-black/5 dark:bg-white/5" />
        <div className="mt-4 h-48 animate-pulse rounded-lg bg-black/5 dark:bg-white/5" />
      </main>
    );
  }

  if (propertyQuery.isError || !propertyQuery.data?.data) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-12">
        <p className="text-muted-foreground">
          We couldn&apos;t find that property.{" "}
          <Link href="/properties" className="underline underline-offset-4">
            Back to browse
          </Link>
        </p>
      </main>
    );
  }

  const property = propertyQuery.data.data;

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <Link href="/properties" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
        ← Back to browse
      </Link>

      <h1 className="mt-4 text-3xl font-semibold tracking-tight">{property.title}</h1>
      <p className="mt-1 text-muted-foreground">
        {property.address}, {property.city}, {property.state}, {property.country}
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Stat label="Monthly rent" value={`${rentFormatter.format(property.monthly_rent)}/mo`} />
        <Stat label="Area" value={`${property.area_sqft.toLocaleString()} sqft`} />
        <Stat label="Status" value={property.status} />
      </div>

      <p className="mt-8 whitespace-pre-line leading-relaxed">{property.description}</p>

      <section className="mt-10 rounded-lg border border-dashed border-border p-6">
        <h2 className="font-medium">AI Verification Report</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Coming in Phase 5 (AI Services) — a VerificationAgent will surface risk signals and a
          confidence score for this listing here.
        </p>
      </section>

      <section className="mt-4 rounded-lg border border-dashed border-border p-6">
        <h2 className="font-medium">Chat with landlord</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Chat threads are not implemented yet — this listing will let you message the landlord
          directly once that lands.
        </p>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium capitalize">{value}</p>
    </div>
  );
}

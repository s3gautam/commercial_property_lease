"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";

import { apiClient } from "@/lib/api/client";
import type { ApiProperty, ApiVerificationReport } from "@/lib/api/types";
import { useAuthStore } from "@/lib/store/auth-store";

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

      <VerificationSection propertyId={property.id} />

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

function VerificationSection({ propertyId }: { propertyId: string }) {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  const reportQuery = useQuery({
    queryKey: ["verification", propertyId],
    queryFn: () => apiClient.get<ApiVerificationReport>(`/properties/${propertyId}/verification`),
    retry: false,
  });

  const generate = useMutation({
    mutationFn: () =>
      apiClient.post<ApiVerificationReport>(`/properties/${propertyId}/verification`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["verification", propertyId] });
    },
  });

  const report = reportQuery.data?.data;

  return (
    <section className="mt-10 rounded-lg border border-border p-6">
      <h2 className="font-medium">AI Verification Report</h2>

      {reportQuery.isLoading && (
        <div className="mt-2 h-4 w-2/3 animate-pulse rounded bg-black/5 dark:bg-white/5" />
      )}

      {report ? (
        <div className="mt-2">
          <p className="text-sm leading-relaxed">{report.summary}</p>
          {report.risk_score !== null && (
            <p className="mt-2 text-sm text-muted-foreground">
              Risk score: <span className="font-medium">{report.risk_score}/100</span>
            </p>
          )}
        </div>
      ) : (
        !reportQuery.isLoading && (
          <div className="mt-2">
            <p className="text-sm text-muted-foreground">
              No verification report yet for this listing.
            </p>
            {user ? (
              <button
                type="button"
                onClick={() => generate.mutate()}
                disabled={generate.isPending}
                className="mt-3 rounded-md border border-border px-3 py-1.5 text-sm disabled:opacity-50"
              >
                {generate.isPending ? "Generating…" : "Generate verification report"}
              </button>
            ) : (
              <p className="mt-2 text-sm">
                <Link href="/login" className="underline underline-offset-4">
                  Log in
                </Link>{" "}
                to generate a verification report.
              </p>
            )}
            {generate.isError && (
              <p className="mt-2 text-sm text-red-500">
                Couldn&apos;t generate a report right now. Please try again.
              </p>
            )}
          </div>
        )
      )}
    </section>
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

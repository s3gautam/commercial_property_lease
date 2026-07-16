"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  IndianRupee,
  MapPin,
  MessagesSquare,
  Ruler,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

import { apiClient } from "@/lib/api/client";
import type { ApiProperty, ApiVerificationReport } from "@/lib/api/types";
import { propertyImageUrl, propertyMapEmbedUrl } from "@/lib/property-image";
import { useAuthStore } from "@/lib/store/auth-store";

const rentFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const STATUS_STYLES: Record<string, string> = {
  listed: "bg-success/15 text-success",
  draft: "bg-warning/15 text-warning",
  leased: "bg-accent/15 text-accent",
  archived: "bg-muted-foreground/15 text-muted-foreground",
};

export default function PropertyDetailPage() {
  const params = useParams<{ id: string }>();

  const propertyQuery = useQuery({
    queryKey: ["properties", params.id],
    queryFn: () => apiClient.get<ApiProperty>(`/properties/${params.id}`),
  });

  if (propertyQuery.isLoading) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-14">
        <div className="h-8 w-2/3 animate-pulse rounded-lg bg-surface-2" />
        <div className="mt-4 h-48 animate-pulse rounded-2xl bg-surface-2" />
      </main>
    );
  }

  if (propertyQuery.isError || !propertyQuery.data?.data) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-14">
        <p className="text-muted-foreground">
          We couldn&apos;t find that property.{" "}
          <Link href="/properties" className="text-accent underline underline-offset-4">
            Back to browse
          </Link>
        </p>
      </main>
    );
  }

  const property = propertyQuery.data.data;

  return (
    <main className="mx-auto max-w-3xl px-6 py-14">
      <Link
        href="/properties"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to browse
      </Link>

      <div className="relative mt-5 h-64 w-full overflow-hidden rounded-3xl bg-surface-2 shadow-card sm:h-80">
        <Image
          src={propertyImageUrl(property.id, 1200, 700)}
          alt={property.title}
          fill
          priority
          sizes="(min-width: 768px) 768px, 100vw"
          className="object-cover"
        />
      </div>

      <div className="mt-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{property.title}</h1>
          <p className="mt-1.5 flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="h-4 w-4" strokeWidth={2} />
            {property.address}, {property.city}, {property.state}, {property.country}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium capitalize ${
            STATUS_STYLES[property.status] ?? STATUS_STYLES.draft
          }`}
        >
          {property.status}
        </span>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat
          icon={IndianRupee}
          label="Monthly rent"
          value={`${rentFormatter.format(property.monthly_rent)}/mo`}
          accent
        />
        <Stat icon={Ruler} label="Area" value={`${property.area_sqft.toLocaleString()} sqft`} />
        <Stat icon={MapPin} label="City" value={property.city} />
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-surface p-6 shadow-soft">
        <h2 className="font-medium">About this space</h2>
        <p className="mt-2 whitespace-pre-line leading-relaxed text-muted-foreground">
          {property.description}
        </p>
      </div>

      <h2 className="mt-8 flex items-center gap-2 font-medium">
        <MapPin className="h-4 w-4 text-accent" strokeWidth={2} />
        Location
      </h2>
      <div className="mt-3 overflow-hidden rounded-2xl border border-border shadow-soft">
        <iframe
          title="Property location"
          src={propertyMapEmbedUrl(property)}
          className="h-64 w-full sm:h-80"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>

      <VerificationSection property={property} />

      <section className="mt-5 rounded-2xl border border-dashed border-border p-6">
        <div className="flex items-center gap-2">
          <MessagesSquare className="h-4 w-4 text-muted-foreground" strokeWidth={2} />
          <h2 className="font-medium">Chat with landlord</h2>
        </div>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Chat threads are not implemented yet — this listing will let you message the landlord
          directly once that lands.
        </p>
      </section>
    </main>
  );
}

// TODO: wired to a client-side dummy generator for now instead of
// POST /properties/{id}/verification (the real AI verification
// endpoint) so the demo works without depending on a live Groq call
// succeeding. Swap buildDummyReport() for the real apiClient.post call
// once that's ready to exercise end to end again.
function buildDummyReport(property: ApiProperty): ApiVerificationReport {
  const riskScore = Math.round(10 + Math.random() * 35);
  return {
    id: "dummy",
    property_id: property.id,
    summary:
      `This ${property.area_sqft.toLocaleString()} sqft space in ${property.city} appears ` +
      `well-documented, with rent consistent with comparable listings in the area. No major ` +
      `red flags were found in the listing details, though we recommend confirming ownership ` +
      "and zoning documents directly with the landlord before signing.",
    risk_score: riskScore,
    status: "completed",
    created_at: new Date().toISOString(),
  };
}

function VerificationSection({ property }: { property: ApiProperty }) {
  const user = useAuthStore((state) => state.user);
  const [report, setReport] = useState<ApiVerificationReport | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setReport(buildDummyReport(property));
      setIsGenerating(false);
    }, 900);
  };

  return (
    <section className="mt-5 rounded-2xl border border-border bg-surface p-6 shadow-soft">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-accent" strokeWidth={2} />
        <h2 className="font-medium">AI Verification Report</h2>
      </div>

      {report ? (
        <div className="mt-3">
          <p className="text-sm leading-relaxed text-muted-foreground">{report.summary}</p>
          {report.risk_score !== null && <RiskGauge score={report.risk_score} />}
        </div>
      ) : (
        <div className="mt-3">
          <p className="text-sm text-muted-foreground">
            No verification report yet for this listing.
          </p>
          {user ? (
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-accent-gradient px-4 py-2 text-sm font-medium text-white shadow-glow transition-transform hover:scale-[1.03] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {isGenerating ? "Generating…" : "Generate verification report"}
            </button>
          ) : (
            <p className="mt-2 text-sm">
              <Link href="/login" className="text-accent underline underline-offset-4">
                Log in
              </Link>{" "}
              to generate a verification report.
            </p>
          )}
        </div>
      )}
    </section>
  );
}

function RiskGauge({ score }: { score: number }) {
  const clamped = Math.min(100, Math.max(0, score));
  const tone = clamped < 34 ? "bg-success" : clamped < 67 ? "bg-warning" : "bg-danger";

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Risk score</span>
        <span className="font-medium text-foreground">{clamped}/100</span>
      </div>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
        <div
          className={`h-full rounded-full ${tone} transition-all duration-700`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-soft">
      <div className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3.5 w-3.5" strokeWidth={2} />
        {label}
      </div>
      <p className={`mt-1.5 font-semibold capitalize ${accent ? "text-gradient" : ""}`}>{value}</p>
    </div>
  );
}

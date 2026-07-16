"use client";

import { CheckCircle2, FileText, ShieldCheck, Upload } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { useAuthStore } from "@/lib/store/auth-store";

type DocKey = "pan" | "aadhaar" | "business";
type DocStatus = "empty" | "selected" | "verifying" | "verified";

const DOCUMENTS: { key: DocKey; label: string; hint: string }[] = [
  { key: "pan", label: "PAN card", hint: "Permanent Account Number, for tax identification" },
  { key: "aadhaar", label: "Aadhaar card", hint: "Government-issued identity proof" },
  { key: "business", label: "Business registration", hint: "GST certificate, incorporation certificate, or equivalent" },
];

export default function KycPage() {
  const user = useAuthStore((state) => state.user);

  const [fileNames, setFileNames] = useState<Record<DocKey, string | null>>({
    pan: null,
    aadhaar: null,
    business: null,
  });
  const [statuses, setStatuses] = useState<Record<DocKey, DocStatus>>({
    pan: "empty",
    aadhaar: "empty",
    business: "empty",
  });
  const [submitted, setSubmitted] = useState(false);

  const allSelected = DOCUMENTS.every((doc) => fileNames[doc.key]);
  const allVerified = DOCUMENTS.every((doc) => statuses[doc.key] === "verified");

  const handleFileChange = (key: DocKey, file: File | null) => {
    setFileNames((prev) => ({ ...prev, [key]: file?.name ?? null }));
    setStatuses((prev) => ({ ...prev, [key]: file ? "selected" : "empty" }));
  };

  const handleSubmit = () => {
    setSubmitted(true);
    setStatuses({ pan: "verifying", aadhaar: "verifying", business: "verifying" });

    DOCUMENTS.forEach((doc, index) => {
      setTimeout(() => {
        setStatuses((prev) => ({ ...prev, [doc.key]: "verified" }));
      }, 900 + index * 500);
    });
  };

  if (!user) {
    return (
      <main className="bg-mesh flex min-h-[calc(100vh-65px)] items-center justify-center px-6 py-16">
        <div className="animate-fade-up max-w-sm rounded-3xl border border-border bg-surface p-8 text-center shadow-card">
          <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-gradient text-white shadow-glow">
            <ShieldCheck className="h-5 w-5" strokeWidth={2.25} />
          </span>
          <h1 className="text-2xl font-semibold tracking-tight">Verify your identity</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            <Link href="/login" className="text-accent underline underline-offset-4">
              Log in
            </Link>{" "}
            to start your KYC verification.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-mesh min-h-[calc(100vh-65px)] px-6 py-14">
      <div className="mx-auto max-w-2xl">
        <div className="mb-10 text-center">
          <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-gradient text-white shadow-glow">
            <ShieldCheck className="h-5 w-5" strokeWidth={2.25} />
          </span>
          <h1 className="text-3xl font-semibold tracking-tight">Tenant verification (KYC)</h1>
          <p className="mt-1.5 text-muted-foreground">
            Upload the documents below to verify your business identity.
          </p>
        </div>

        {allVerified ? (
          <div className="animate-fade-up rounded-3xl border border-border bg-surface p-8 text-center shadow-card">
            <span className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success">
              <CheckCircle2 className="h-7 w-7" strokeWidth={2} />
            </span>
            <h2 className="text-xl font-semibold tracking-tight">You&apos;re verified</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              All documents were approved. You&apos;re all set to lease commercial space on
              PropLease AI.
            </p>
            <Link
              href="/properties"
              className="mt-6 inline-block rounded-full bg-accent-gradient px-5 py-2.5 text-sm font-medium text-white shadow-glow transition-transform hover:scale-[1.03] active:scale-[0.98]"
            >
              Browse properties
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {DOCUMENTS.map((doc) => (
              <DocumentUploader
                key={doc.key}
                label={doc.label}
                hint={doc.hint}
                fileName={fileNames[doc.key]}
                status={statuses[doc.key]}
                disabled={submitted}
                onFileChange={(file) => handleFileChange(doc.key, file)}
              />
            ))}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!allSelected || submitted}
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-accent-gradient px-5 py-3 text-sm font-medium text-white shadow-glow transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50"
            >
              {submitted ? "Verifying documents…" : "Submit for verification"}
            </button>

            <p className="text-center text-xs text-muted-foreground">
              Document upload and verification are simulated for this demo — nothing is stored.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

function DocumentUploader({
  label,
  hint,
  fileName,
  status,
  disabled,
  onFileChange,
}: {
  label: string;
  hint: string;
  fileName: string | null;
  status: DocStatus;
  disabled: boolean;
  onFileChange: (file: File | null) => void;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-muted-foreground">
            <FileText className="h-5 w-5" strokeWidth={2} />
          </span>
          <div>
            <p className="text-sm font-medium">{label}</p>
            <p className="text-xs text-muted-foreground">{hint}</p>
          </div>
        </div>

        <StatusBadge status={status} />
      </div>

      <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-background px-4 py-3 text-sm text-muted-foreground transition-colors hover:bg-surface-2 has-[:disabled]:pointer-events-none has-[:disabled]:opacity-50">
        <Upload className="h-4 w-4" strokeWidth={2} />
        {fileName ?? "Choose a file…"}
        <input
          type="file"
          accept="image/*,.pdf"
          disabled={disabled}
          className="hidden"
          onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
        />
      </label>
    </div>
  );
}

function StatusBadge({ status }: { status: DocStatus }) {
  if (status === "verified") {
    return (
      <span className="flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-1 text-xs font-medium text-success">
        <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} />
        Verified
      </span>
    );
  }
  if (status === "verifying") {
    return (
      <span className="rounded-full bg-warning/15 px-2.5 py-1 text-xs font-medium text-warning">
        Verifying…
      </span>
    );
  }
  if (status === "selected") {
    return (
      <span className="rounded-full bg-accent/15 px-2.5 py-1 text-xs font-medium text-accent">
        Ready
      </span>
    );
  }
  return (
    <span className="rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-muted-foreground">
      Not uploaded
    </span>
  );
}

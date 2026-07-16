"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Building } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { apiClient, ApiError } from "@/lib/api/client";
import type { ApiTenantProfile } from "@/lib/api/types";
import { useAuthStore } from "@/lib/store/auth-store";

export default function OnboardingPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);

  const [companyName, setCompanyName] = useState("");
  const [businessType, setBusinessType] = useState("");

  useEffect(() => {
    if (hasHydrated && !user) router.replace("/login");
  }, [hasHydrated, user, router]);

  const existingProfile = useQuery({
    queryKey: ["tenant-profile", "me"],
    queryFn: () => apiClient.get<ApiTenantProfile>("/tenant-profile/me"),
    enabled: Boolean(user),
    retry: false,
  });

  useEffect(() => {
    const profile = existingProfile.data?.data;
    if (profile) {
      setCompanyName(profile.company_name ?? "");
      setBusinessType(profile.business_type ?? "");
    }
  }, [existingProfile.data]);

  const saveProfile = useMutation({
    mutationFn: () =>
      apiClient.put<ApiTenantProfile>("/tenant-profile/me", {
        company_name: companyName || null,
        business_type: businessType || null,
      }),
    onSuccess: () => router.push("/properties"),
  });

  if (!user) return null;

  return (
    <main className="bg-mesh flex min-h-[calc(100vh-65px)] items-center justify-center px-6 py-16">
      <div className="animate-fade-up w-full max-w-sm rounded-3xl border border-border bg-surface p-8 shadow-card">
        <div className="mb-7 flex flex-col items-center text-center">
          <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-gradient text-white shadow-glow">
            <Building className="h-5 w-5" strokeWidth={2.25} />
          </span>
          <h1 className="text-2xl font-semibold tracking-tight">Create your profile</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Tell us a bit about your business so landlords know who they&apos;re leasing to.
          </p>
        </div>

        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            saveProfile.mutate();
          }}
        >
          <label className="flex flex-col gap-1.5 text-sm">
            Company name
            <input
              value={companyName}
              onChange={(event) => setCompanyName(event.target.value)}
              className="rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition-shadow focus:shadow-glow"
              placeholder="Acme Corp"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            Business type
            <input
              value={businessType}
              onChange={(event) => setBusinessType(event.target.value)}
              className="rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition-shadow focus:shadow-glow"
              placeholder="Retail, Office, Restaurant…"
            />
          </label>

          <button
            type="submit"
            disabled={saveProfile.isPending}
            className="rounded-xl bg-accent-gradient px-4 py-2.5 text-sm font-medium text-white shadow-glow transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:pointer-events-none disabled:opacity-60"
          >
            {saveProfile.isPending ? "Saving…" : "Save and continue"}
          </button>

          {saveProfile.isError && (
            <p className="text-center text-sm text-danger">
              {saveProfile.error instanceof ApiError
                ? saveProfile.error.message
                : "Something went wrong. Please try again."}
            </p>
          )}

          <button
            type="button"
            onClick={() => router.push("/properties")}
            className="text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            Skip for now
          </button>
        </form>
      </div>
    </main>
  );
}

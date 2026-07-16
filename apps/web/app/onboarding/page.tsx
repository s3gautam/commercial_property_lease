"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
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
    <main className="mx-auto flex max-w-sm flex-col gap-6 px-6 py-16">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Create your profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
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
            className="rounded-md border border-border bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-foreground/20"
            placeholder="Acme Corp"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          Business type
          <input
            value={businessType}
            onChange={(event) => setBusinessType(event.target.value)}
            className="rounded-md border border-border bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-foreground/20"
            placeholder="Retail, Office, Restaurant…"
          />
        </label>

        <button
          type="submit"
          disabled={saveProfile.isPending}
          className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity disabled:opacity-50"
        >
          {saveProfile.isPending ? "Saving…" : "Save and continue"}
        </button>

        {saveProfile.isError && (
          <p className="text-sm text-red-500">
            {saveProfile.error instanceof ApiError
              ? saveProfile.error.message
              : "Something went wrong. Please try again."}
          </p>
        )}

        <button
          type="button"
          onClick={() => router.push("/properties")}
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          Skip for now
        </button>
      </form>
    </main>
  );
}

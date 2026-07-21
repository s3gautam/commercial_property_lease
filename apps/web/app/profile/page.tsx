"use client";

import { useQuery } from "@tanstack/react-query";
import { CalendarCheck, CalendarX2, MapPin, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { PropertyCard } from "@/components/property-card";
import { ScheduleVisitModal } from "@/components/schedule-visit-modal";
import { apiClient } from "@/lib/api/client";
import type { ApiTenantProfile, ApiVisit } from "@/lib/api/types";
import {
  toVisitErrorMessage,
  useCancelVisitMutation,
  useRescheduleVisitMutation,
  useVisitsQuery,
} from "@/lib/hooks/use-visits";
import { useAuthStore } from "@/lib/store/auth-store";
import { useWatchlistStore } from "@/lib/store/watchlist-store";

const DATE_LABEL = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
});

export default function ProfilePage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);

  const visitsQuery = useVisitsQuery();
  const rescheduleVisit = useRescheduleVisitMutation();
  const cancelVisit = useCancelVisitMutation();
  const watchlist = useWatchlistStore((state) => state.properties);

  const [rescheduling, setRescheduling] = useState<ApiVisit | null>(null);
  const [confirmingReschedule, setConfirmingReschedule] = useState<ApiVisit | null>(null);
  const [confirmingCancel, setConfirmingCancel] = useState<ApiVisit | null>(null);

  useEffect(() => {
    if (hasHydrated && !user) router.replace("/login");
  }, [hasHydrated, user, router]);

  const profileQuery = useQuery({
    queryKey: ["tenant-profile", "me"],
    queryFn: () => apiClient.get<ApiTenantProfile>("/tenant-profile/me"),
    enabled: Boolean(user),
    retry: false,
  });

  if (!user) return null;

  const visits = visitsQuery.data?.data ?? [];
  const upcoming = visits
    .filter((v) => v.status === "upcoming")
    .sort((a, b) => (a.visit_date + a.visit_time).localeCompare(b.visit_date + b.visit_time));
  const cancelled = visits.filter((v) => v.status === "cancelled");
  const profile = profileQuery.data?.data;

  return (
    <main className="mx-auto max-w-4xl px-6 py-14">
      <div className="mb-8 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-gradient text-white shadow-glow">
          <User className="h-5 w-5" strokeWidth={2.25} />
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {profile?.company_name || user.email || user.phone}
          </h1>
          <p className="text-sm text-muted-foreground">
            {user.email ?? user.phone}
            {profile?.business_type ? ` · ${profile.business_type}` : ""}
          </p>
        </div>
        <Link
          href="/onboarding"
          className="ml-auto shrink-0 rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium shadow-soft transition-colors hover:bg-surface-2"
        >
          Edit profile
        </Link>
      </div>

      <div className="mx-auto max-w-2xl">
      <h2 className="text-lg font-semibold tracking-tight">My bookings</h2>

      {upcoming.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
          No visits scheduled yet.{" "}
          <Link href="/properties" className="text-accent underline underline-offset-4">
            Browse properties
          </Link>{" "}
          to schedule one.
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {upcoming.map((visit) => (
            <div
              key={visit.id}
              className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <Link
                  href={`/properties/${visit.property_id}`}
                  className="flex items-center gap-1.5 font-medium hover:text-accent"
                >
                  <MapPin className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                  <span className="line-clamp-1">{visit.property_title}</span>
                </Link>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <CalendarCheck className="h-3.5 w-3.5" strokeWidth={2} />
                  {DATE_LABEL.format(new Date(visit.visit_date))} at {visit.visit_time}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmingReschedule(visit)}
                  className="rounded-full border border-border px-3.5 py-1.5 text-sm font-medium transition-colors hover:bg-surface-2"
                >
                  Reschedule
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingCancel(visit)}
                  className="rounded-full border border-border px-3.5 py-1.5 text-sm font-medium text-danger transition-colors hover:bg-danger/10"
                >
                  Cancel
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {cancelled.length > 0 && (
        <>
          <h2 className="mt-10 text-lg font-semibold tracking-tight">Cancelled</h2>
          <div className="mt-4 flex flex-col gap-3">
            {cancelled.map((visit) => (
              <div
                key={visit.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-dashed border-border p-4 text-muted-foreground"
              >
                <div>
                  <p className="flex items-center gap-1.5 font-medium line-through">
                    <MapPin className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                    <span className="line-clamp-1">{visit.property_title}</span>
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-sm">
                    <CalendarX2 className="h-3.5 w-3.5" strokeWidth={2} />
                    {DATE_LABEL.format(new Date(visit.visit_date))} at {visit.visit_time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      </div>

      <h2 className="mt-10 text-lg font-semibold tracking-tight">Watchlist</h2>

      {watchlist.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
          No saved properties yet. Tap the heart icon on any listing to save it here.
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {watchlist.map((property, index) => (
            <PropertyCard key={property.id} property={property} animationDelayMs={index * 40} />
          ))}
        </div>
      )}

      {rescheduling && (
        <ScheduleVisitModal
          propertyId={rescheduling.property_id}
          propertyTitle={rescheduling.property_title}
          open={Boolean(rescheduling)}
          onClose={() => setRescheduling(null)}
          onConfirm={async (visitDate, visitTime) => {
            try {
              await rescheduleVisit.mutateAsync({
                visitId: rescheduling.id,
                visit_date: visitDate,
                visit_time: visitTime,
              });
              return null;
            } catch (error) {
              return await toVisitErrorMessage(error);
            }
          }}
        />
      )}

      <ConfirmDialog
        open={Boolean(confirmingReschedule)}
        title="Reschedule this visit?"
        description={
          confirmingReschedule
            ? `You'll pick a new time for your visit to ${confirmingReschedule.property_title}, currently set for ${DATE_LABEL.format(new Date(confirmingReschedule.visit_date))} at ${confirmingReschedule.visit_time}.`
            : ""
        }
        confirmLabel="Pick a new time"
        onConfirm={() => {
          if (confirmingReschedule) setRescheduling(confirmingReschedule);
        }}
        onClose={() => setConfirmingReschedule(null)}
      />

      <ConfirmDialog
        open={Boolean(confirmingCancel)}
        title="Cancel this visit?"
        description={
          confirmingCancel
            ? `This will cancel your visit to ${confirmingCancel.property_title} on ${DATE_LABEL.format(new Date(confirmingCancel.visit_date))} at ${confirmingCancel.visit_time}.`
            : ""
        }
        confirmLabel="Cancel visit"
        danger
        onConfirm={() => {
          if (confirmingCancel) cancelVisit.mutate(confirmingCancel.id);
        }}
        onClose={() => setConfirmingCancel(null)}
      />
    </main>
  );
}

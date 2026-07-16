"use client";

import { useQuery } from "@tanstack/react-query";
import { CalendarCheck, CalendarX2, MapPin, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ScheduleVisitModal } from "@/components/schedule-visit-modal";
import { apiClient } from "@/lib/api/client";
import type { ApiTenantProfile } from "@/lib/api/types";
import { type Booking, useBookingsStore } from "@/lib/store/bookings-store";
import { useAuthStore } from "@/lib/store/auth-store";

const DATE_LABEL = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
});

export default function ProfilePage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);

  const bookings = useBookingsStore((state) => state.bookings);
  const cancelBooking = useBookingsStore((state) => state.cancelBooking);
  const rescheduleBooking = useBookingsStore((state) => state.rescheduleBooking);
  const checkConflict = useBookingsStore((state) => state.checkConflict);

  const [rescheduling, setRescheduling] = useState<Booking | null>(null);

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

  const upcoming = bookings
    .filter((b) => b.status === "upcoming")
    .sort((a, b) => (a.dateKey + a.time).localeCompare(b.dateKey + b.time));
  const cancelled = bookings.filter((b) => b.status === "cancelled");
  const profile = profileQuery.data?.data;

  return (
    <main className="mx-auto max-w-2xl px-6 py-14">
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
          {upcoming.map((booking) => (
            <div
              key={booking.id}
              className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <Link
                  href={`/properties/${booking.propertyId}`}
                  className="flex items-center gap-1.5 font-medium hover:text-accent"
                >
                  <MapPin className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                  <span className="line-clamp-1">{booking.propertyTitle}</span>
                </Link>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <CalendarCheck className="h-3.5 w-3.5" strokeWidth={2} />
                  {DATE_LABEL.format(new Date(booking.dateKey))} at {booking.time}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRescheduling(booking)}
                  className="rounded-full border border-border px-3.5 py-1.5 text-sm font-medium transition-colors hover:bg-surface-2"
                >
                  Reschedule
                </button>
                <button
                  type="button"
                  onClick={() => cancelBooking(booking.id)}
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
            {cancelled.map((booking) => (
              <div
                key={booking.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-dashed border-border p-4 text-muted-foreground"
              >
                <div>
                  <p className="flex items-center gap-1.5 font-medium line-through">
                    <MapPin className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                    <span className="line-clamp-1">{booking.propertyTitle}</span>
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-sm">
                    <CalendarX2 className="h-3.5 w-3.5" strokeWidth={2} />
                    {DATE_LABEL.format(new Date(booking.dateKey))} at {booking.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {rescheduling && (
        <ScheduleVisitModal
          propertyId={rescheduling.propertyId}
          propertyTitle={rescheduling.propertyTitle}
          open={Boolean(rescheduling)}
          onClose={() => setRescheduling(null)}
          onConfirm={(dateKey, time) => {
            const conflict = checkConflict(rescheduling.propertyId, dateKey, time, rescheduling.id);
            if (conflict) return conflict.message;
            rescheduleBooking(rescheduling.id, dateKey, time);
            return null;
          }}
        />
      )}
    </main>
  );
}

"use client";

import { CalendarCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { ScheduleVisitModal } from "@/components/schedule-visit-modal";
import { useBookingsStore } from "@/lib/store/bookings-store";
import { useAuthStore } from "@/lib/store/auth-store";

export function ScheduleVisitCta({
  propertyId,
  propertyTitle,
}: {
  propertyId: string;
  propertyTitle: string;
}) {
  const user = useAuthStore((state) => state.user);
  const addBooking = useBookingsStore((state) => state.addBooking);
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-6 flex flex-col items-start justify-between gap-4 rounded-2xl bg-accent-gradient p-6 text-white shadow-glow sm:flex-row sm:items-center">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15">
          <CalendarCheck className="h-5 w-5" strokeWidth={2.25} />
        </span>
        <div>
          <h2 className="font-semibold">Want to see it in person?</h2>
          <p className="text-sm text-white/80">Pick a time — the landlord will be notified right away.</p>
        </div>
      </div>

      {user ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full shrink-0 rounded-full bg-white px-6 py-3 text-sm font-semibold text-accent shadow-soft transition-transform hover:scale-[1.03] active:scale-[0.98] sm:w-auto"
        >
          Schedule a visit
        </button>
      ) : (
        <Link
          href="/login"
          className="w-full shrink-0 rounded-full bg-white px-6 py-3 text-center text-sm font-semibold text-accent shadow-soft transition-transform hover:scale-[1.03] active:scale-[0.98] sm:w-auto"
        >
          Log in to schedule
        </Link>
      )}

      {user && (
        <ScheduleVisitModal
          propertyId={propertyId}
          propertyTitle={propertyTitle}
          open={open}
          onClose={() => setOpen(false)}
          onConfirm={(dateKey, time) => addBooking({ propertyId, propertyTitle, dateKey, time })}
        />
      )}
    </div>
  );
}

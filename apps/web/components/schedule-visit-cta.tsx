"use client";

import { CalendarCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { ScheduleVisitModal } from "@/components/schedule-visit-modal";
import { useAuthStore } from "@/lib/store/auth-store";
import { useBookingsStore } from "@/lib/store/bookings-store";

const DATE_LABEL = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
});

export function ScheduleVisitCta({
  propertyId,
  propertyTitle,
}: {
  propertyId: string;
  propertyTitle: string;
}) {
  const user = useAuthStore((state) => state.user);
  const bookings = useBookingsStore((state) => state.bookings);
  const addBooking = useBookingsStore((state) => state.addBooking);
  const rescheduleBooking = useBookingsStore((state) => state.rescheduleBooking);
  const cancelBooking = useBookingsStore((state) => state.cancelBooking);
  const checkConflict = useBookingsStore((state) => state.checkConflict);
  const [open, setOpen] = useState(false);

  const existingBooking = bookings.find(
    (b) => b.propertyId === propertyId && b.status === "upcoming",
  );

  return (
    <div className="mt-6 flex flex-col items-start justify-between gap-4 rounded-2xl bg-accent-gradient p-6 text-white shadow-glow sm:flex-row sm:items-center">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15">
          <CalendarCheck className="h-5 w-5" strokeWidth={2.25} />
        </span>
        <div>
          {existingBooking ? (
            <>
              <h2 className="font-semibold">Visit scheduled</h2>
              <p className="text-sm text-white/80">
                {DATE_LABEL.format(new Date(existingBooking.dateKey))} at {existingBooking.time}
              </p>
            </>
          ) : (
            <>
              <h2 className="font-semibold">Want to see it in person?</h2>
              <p className="text-sm text-white/80">
                Pick a time — the landlord will be notified right away.
              </p>
            </>
          )}
        </div>
      </div>

      {user ? (
        existingBooking ? (
          <div className="flex w-full shrink-0 gap-2 sm:w-auto">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="flex-1 rounded-full bg-white px-5 py-3 text-sm font-semibold text-accent shadow-soft transition-transform hover:scale-[1.03] active:scale-[0.98] sm:flex-none"
            >
              Reschedule
            </button>
            <button
              type="button"
              onClick={() => cancelBooking(existingBooking.id)}
              className="flex-1 rounded-full border border-white/40 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10 sm:flex-none"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="w-full shrink-0 rounded-full bg-white px-6 py-3 text-sm font-semibold text-accent shadow-soft transition-transform hover:scale-[1.03] active:scale-[0.98] sm:w-auto"
          >
            Schedule a visit
          </button>
        )
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
          onConfirm={(dateKey, time) => {
            if (existingBooking) {
              const conflict = checkConflict(propertyId, dateKey, time, existingBooking.id);
              if (conflict) return conflict.message;
              rescheduleBooking(existingBooking.id, dateKey, time);
              return null;
            }
            const conflict = checkConflict(propertyId, dateKey, time);
            if (conflict) return conflict.message;
            addBooking({ propertyId, propertyTitle, dateKey, time });
            return null;
          }}
        />
      )}
    </div>
  );
}

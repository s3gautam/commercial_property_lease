"use client";

import { CalendarCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { ScheduleVisitModal } from "@/components/schedule-visit-modal";
import {
  toVisitErrorMessage,
  useBookVisitMutation,
  useCancelVisitMutation,
  useRescheduleVisitMutation,
  useVisitsQuery,
} from "@/lib/hooks/use-visits";
import { useAuthStore } from "@/lib/store/auth-store";

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
  const visitsQuery = useVisitsQuery();
  const bookVisit = useBookVisitMutation();
  const rescheduleVisit = useRescheduleVisitMutation();
  const cancelVisit = useCancelVisitMutation();
  const [open, setOpen] = useState(false);

  const existingBooking = (visitsQuery.data?.data ?? []).find(
    (v) => v.property_id === propertyId && v.status === "upcoming",
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
                {DATE_LABEL.format(new Date(existingBooking.visit_date))} at{" "}
                {existingBooking.visit_time}
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
              disabled={cancelVisit.isPending}
              onClick={() => cancelVisit.mutate(existingBooking.id)}
              className="flex-1 rounded-full border border-white/40 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10 disabled:opacity-60 sm:flex-none"
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
          onConfirm={async (visitDate, visitTime) => {
            try {
              if (existingBooking) {
                await rescheduleVisit.mutateAsync({
                  visitId: existingBooking.id,
                  visit_date: visitDate,
                  visit_time: visitTime,
                });
              } else {
                await bookVisit.mutateAsync({
                  property_id: propertyId,
                  visit_date: visitDate,
                  visit_time: visitTime,
                });
              }
              return null;
            } catch (error) {
              return await toVisitErrorMessage(error);
            }
          }}
        />
      )}
    </div>
  );
}

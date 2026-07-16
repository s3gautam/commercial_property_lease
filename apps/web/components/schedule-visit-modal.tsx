"use client";

import { CalendarCheck, X } from "lucide-react";
import { useEffect, useState } from "react";

import { dateKey, getTimeSlots, getUpcomingDates, isClosedDay } from "@/lib/property-schedule";

const DAY_LABEL = new Intl.DateTimeFormat("en-US", { weekday: "short" });
const DATE_LABEL = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });

interface ScheduleVisitModalProps {
  propertyId: string;
  propertyTitle: string;
  open: boolean;
  onClose: () => void;
  onConfirm: (dateKey: string, time: string) => void;
}

export function ScheduleVisitModal({
  propertyId,
  propertyTitle,
  open,
  onClose,
  onConfirm,
}: ScheduleVisitModalProps) {
  const dates = getUpcomingDates();
  const [selectedDate, setSelectedDate] = useState<Date>(
    dates.find((d) => !isClosedDay(d)) ?? dates[0]!,
  );
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<{ dateKey: string; time: string } | null>(null);

  useEffect(() => {
    if (open) {
      setSelectedTime(null);
      setConfirmed(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const slots = getTimeSlots(propertyId, selectedDate);

  const handleConfirm = () => {
    if (!selectedTime) return;
    const key = dateKey(selectedDate);
    onConfirm(key, selectedTime);
    setConfirmed({ dateKey: key, time: selectedTime });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="animate-fade-up w-full max-w-lg rounded-3xl border border-border bg-surface p-6 shadow-card"
        onClick={(event) => event.stopPropagation()}
      >
        {confirmed ? (
          <div className="py-4 text-center">
            <span className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success">
              <CalendarCheck className="h-7 w-7" strokeWidth={2} />
            </span>
            <h2 className="text-xl font-semibold tracking-tight">Visit scheduled</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              You&apos;re set for{" "}
              <span className="font-medium text-foreground">
                {DAY_LABEL.format(new Date(confirmed.dateKey))}, {DATE_LABEL.format(new Date(confirmed.dateKey))}
              </span>{" "}
              at <span className="font-medium text-foreground">{confirmed.time}</span>. The
              landlord has been notified.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 rounded-full bg-accent-gradient px-5 py-2.5 text-sm font-medium text-white shadow-glow transition-transform hover:scale-[1.03] active:scale-[0.98]"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">Schedule a visit</h2>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-1">{propertyTitle}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-surface-2"
              >
                <X className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>

            <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
              {dates.map((date) => {
                const closed = isClosedDay(date);
                const active = dateKey(date) === dateKey(selectedDate);
                return (
                  <button
                    key={dateKey(date)}
                    type="button"
                    disabled={closed}
                    onClick={() => {
                      setSelectedDate(date);
                      setSelectedTime(null);
                    }}
                    className={`flex shrink-0 flex-col items-center rounded-xl border px-3 py-2 text-xs transition-colors ${
                      active
                        ? "border-transparent bg-accent-gradient text-white shadow-glow"
                        : "border-border bg-background text-foreground hover:bg-surface-2"
                    } ${closed ? "cursor-not-allowed opacity-40" : ""}`}
                  >
                    <span className="font-medium">{DAY_LABEL.format(date)}</span>
                    <span>{DATE_LABEL.format(date)}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-5">
              {slots.length === 0 ? (
                <p className="rounded-xl bg-surface-2 px-4 py-6 text-center text-sm text-muted-foreground">
                  Closed on this day — pick another date.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {slots.map((slot) => (
                    <button
                      key={slot.time}
                      type="button"
                      disabled={!slot.available}
                      onClick={() => setSelectedTime(slot.time)}
                      className={`rounded-xl border px-3 py-2 text-sm transition-colors ${
                        selectedTime === slot.time
                          ? "border-transparent bg-accent-gradient text-white shadow-glow"
                          : "border-border bg-background hover:bg-surface-2"
                      } ${!slot.available ? "cursor-not-allowed border-border/50 text-muted-foreground/50 line-through" : ""}`}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleConfirm}
              disabled={!selectedTime}
              className="mt-6 w-full rounded-full bg-accent-gradient px-5 py-3 text-sm font-medium text-white shadow-glow transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50"
            >
              {selectedTime ? `Confirm ${selectedTime}` : "Select a time"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

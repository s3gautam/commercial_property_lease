import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Booking {
  id: string;
  propertyId: string;
  propertyTitle: string;
  dateKey: string; // yyyy-mm-dd
  time: string;
  status: "upcoming" | "cancelled";
  createdAt: string;
}

export type BookingConflictReason = "same_property" | "same_time_other_property";

export interface BookingConflict {
  reason: BookingConflictReason;
  message: string;
}

interface BookingsState {
  bookings: Booking[];
  /**
   * Two rules enforced here (the only place bookings are created/moved,
   * so this is the single source of truth for both):
   * 1. A tenant can't have more than one upcoming visit for the same
   *    property - reschedule/cancel the existing one instead.
   * 2. A tenant can't have two upcoming visits at the same date+time,
   *    even across different properties - can't be in two places at
   *    once. `excludeBookingId` lets a reschedule check against every
   *    booking except the one being moved.
   */
  checkConflict: (
    propertyId: string,
    dateKey: string,
    time: string,
    excludeBookingId?: string,
  ) => BookingConflict | null;
  addBooking: (booking: Omit<Booking, "id" | "status" | "createdAt">) => void;
  cancelBooking: (id: string) => void;
  rescheduleBooking: (id: string, dateKey: string, time: string) => void;
}

export const useBookingsStore = create<BookingsState>()(
  persist(
    (set, get) => ({
      bookings: [],
      checkConflict: (propertyId, dateKey, time, excludeBookingId) => {
        const upcoming = get().bookings.filter(
          (b) => b.status === "upcoming" && b.id !== excludeBookingId,
        );

        if (upcoming.some((b) => b.propertyId === propertyId)) {
          return {
            reason: "same_property",
            message:
              "You already have a visit scheduled for this property. Cancel or reschedule it first.",
          };
        }

        if (upcoming.some((b) => b.dateKey === dateKey && b.time === time)) {
          return {
            reason: "same_time_other_property",
            message: "You already have another visit booked at that exact time.",
          };
        }

        return null;
      },
      addBooking: (booking) =>
        set((state) => ({
          bookings: [
            ...state.bookings,
            {
              ...booking,
              id: crypto.randomUUID(),
              status: "upcoming",
              createdAt: new Date().toISOString(),
            },
          ],
        })),
      cancelBooking: (id) =>
        set((state) => ({
          bookings: state.bookings.map((b) => (b.id === id ? { ...b, status: "cancelled" } : b)),
        })),
      rescheduleBooking: (id, dateKey, time) =>
        set((state) => ({
          bookings: state.bookings.map((b) =>
            b.id === id ? { ...b, dateKey, time, status: "upcoming" } : b,
          ),
        })),
    }),
    { name: "proplease-bookings" },
  ),
);

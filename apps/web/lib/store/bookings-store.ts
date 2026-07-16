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

interface BookingsState {
  bookings: Booking[];
  addBooking: (booking: Omit<Booking, "id" | "status" | "createdAt">) => void;
  cancelBooking: (id: string) => void;
  rescheduleBooking: (id: string, dateKey: string, time: string) => void;
}

export const useBookingsStore = create<BookingsState>()(
  persist(
    (set) => ({
      bookings: [],
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

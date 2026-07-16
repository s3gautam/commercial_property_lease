// Visit scheduling has no backend counterpart yet (no Visit/Booking model,
// no real landlord/broker calendar) - available slots are deterministic
// per property+date so the same day always shows the same availability,
// and bookings themselves are stored client-side (see
// lib/store/bookings-store.ts). This is filler consistent with the rest
// of the demo's dummy data, not a real scheduling backend.

export interface TimeSlot {
  time: string;
  available: boolean;
}

const ALL_TIMES = [
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
  "5:00 PM",
];

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  return hash;
}

export function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function getUpcomingDates(count = 14): Date[] {
  const dates: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push(d);
  }
  return dates;
}

export function isClosedDay(date: Date): boolean {
  return date.getDay() === 0; // landlord takes Sundays off
}

export function getTimeSlots(propertyId: string, date: Date): TimeSlot[] {
  if (isClosedDay(date)) return [];

  const seed = hashString(`${propertyId}-${dateKey(date)}`);
  return ALL_TIMES.map((time, index) => ({
    time,
    available: (seed + index * 13) % 10 < 7, // ~70% of slots open
  }));
}

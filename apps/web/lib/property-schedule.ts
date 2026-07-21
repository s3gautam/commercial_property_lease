// There's still no real landlord/broker calendar - available slots are
// deterministic per property+date (mirrored in the backend's
// app/services/visit_schedule.py) so the same day always shows the same
// availability. Visits themselves are real now (services/backend's Visit
// model, via apps/web/lib/hooks/use-visits.ts), just not the slots.

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

function timeToMinutes(time: string): number {
  const [timePart, period] = time.split(" ") as [string, string];
  const [hourStr, minuteStr] = timePart.split(":") as [string, string];
  let hour = Number(hourStr) % 12;
  if (period.toUpperCase() === "PM") hour += 12;
  return hour * 60 + Number(minuteStr);
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
  const now = new Date();
  const isToday = dateKey(date) === dateKey(now);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  return ALL_TIMES.map((time, index) => ({
    time,
    // ~70% of slots open, minus any that have already passed today - a
    // slot at 11 AM shouldn't be offered at 9 PM the same day.
    available: (seed + index * 13) % 10 < 7 && (!isToday || timeToMinutes(time) > currentMinutes),
  }));
}

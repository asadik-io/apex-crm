// The demo data is anchored to a fixed day so every visitor sees the same
// "today", dates stay consistent between server and browser, and screenshots
// do not drift.
export const TODAY = new Date(2026, 9, 19, 9, 0, 0);

export function daysFromToday(days: number, hour = 9, minute = 0) {
  const d = new Date(TODAY);
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d;
}

export function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Whole days from today to the given date; negative means past. */
export function dayDiff(date: Date) {
  const ms = startOfDay(date).getTime() - startOfDay(TODAY).getTime();
  return Math.round(ms / 86_400_000);
}

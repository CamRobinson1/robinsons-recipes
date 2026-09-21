import { todayLocal } from "./types";

// Week handling, Sunday to Saturday.
//
// Everything here works on yyyy-mm-dd strings and builds Date objects from the
// parts, never from Date.parse. `new Date("2026-09-20")` is parsed as UTC
// midnight, which lands on the 19th in Pacific and would shift the whole week.

const ISO = /^\d{4}-\d{2}-\d{2}$/;

function toDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toIso(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function isIsoDate(value: unknown): value is string {
  return typeof value === "string" && ISO.test(value);
}

/** The Sunday on or before the given date. */
export function startOfWeek(iso: string): string {
  const date = toDate(isIsoDate(iso) ? iso : todayLocal());
  date.setDate(date.getDate() - date.getDay());
  return toIso(date);
}

export function thisWeekStart(): string {
  return startOfWeek(todayLocal());
}

export function shiftWeek(weekStart: string, weeks: number): string {
  const date = toDate(weekStart);
  date.setDate(date.getDate() + weeks * 7);
  return toIso(date);
}

/** The seven dates of the week, Sunday first. */
export function weekDates(weekStart: string): string[] {
  const start = toDate(weekStart);
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    return toIso(day);
  });
}

export function dayLabel(iso: string): { weekday: string; date: string } {
  const date = toDate(iso);
  return {
    weekday: date.toLocaleDateString(undefined, { weekday: "short" }),
    date: date.toLocaleDateString(undefined, { month: "numeric", day: "numeric" }),
  };
}

export function weekRangeLabel(weekStart: string): string {
  const dates = weekDates(weekStart);
  const start = toDate(dates[0]);
  const end = toDate(dates[6]);
  const sameMonth = start.getMonth() === end.getMonth();
  const startText = start.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const endText = end.toLocaleDateString(
    undefined,
    sameMonth ? { day: "numeric" } : { month: "short", day: "numeric" }
  );
  return `${startText} to ${endText}`;
}

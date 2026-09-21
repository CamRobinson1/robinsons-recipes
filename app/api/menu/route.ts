import { NextResponse } from "next/server";
import { getMenu, saveMenu } from "@/lib/store";
import { MEAL_SLOTS, type MenuEntry, type WeekMenu } from "@/lib/types";
import { isIsoDate, startOfWeek, weekDates } from "@/lib/week";

export const dynamic = "force-dynamic";

function requestedWeek(request: Request): string {
  const week = new URL(request.url).searchParams.get("week");
  // Snap to Sunday whatever we were handed, so one week is never stored twice.
  return startOfWeek(isIsoDate(week) ? week : "");
}

/** Drops anything that isn't a real slot of this week, then trims what's left. */
function cleanEntries(raw: unknown, weekStart: string): Record<string, MenuEntry> {
  const allowed = new Set(weekDates(weekStart).flatMap((d) => MEAL_SLOTS.map((s) => `${d}_${s}`)));
  const input = (raw ?? {}) as Record<string, unknown>;
  const entries: Record<string, MenuEntry> = {};

  for (const [key, value] of Object.entries(input)) {
    if (!allowed.has(key) || !value || typeof value !== "object") continue;
    const entry = value as Partial<MenuEntry>;
    const title = typeof entry.title === "string" ? entry.title.trim().slice(0, 160) : "";
    if (!title) continue;
    entries[key] = {
      recipeId: typeof entry.recipeId === "string" ? entry.recipeId.slice(0, 64) : "",
      title,
    };
  }
  return entries;
}

export async function GET(request: Request) {
  const weekStart = requestedWeek(request);
  return NextResponse.json({ menu: await getMenu(weekStart) });
}

export async function PUT(request: Request) {
  const weekStart = requestedWeek(request);
  const body = (await request.json().catch(() => ({}))) as { entries?: unknown };

  const menu: WeekMenu = {
    weekStart,
    entries: cleanEntries(body.entries, weekStart),
    updatedAt: Date.now(),
  };

  await saveMenu(menu);
  return NextResponse.json({ menu });
}

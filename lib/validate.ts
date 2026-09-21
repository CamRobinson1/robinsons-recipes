import { METHODS } from "./constants";
import { todayLocal, type Photo, type Recipe } from "./types";

function str(value: unknown, max = 400): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function num(value: unknown, min: number, max: number): number | null {
  const n = typeof value === "string" ? Number(value) : value;
  if (typeof n !== "number" || !Number.isFinite(n)) return null;
  return Math.min(max, Math.max(min, n));
}

function strList(value: unknown, max = 200): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((v) => str(v, 400))
    .filter(Boolean)
    .slice(0, max);
}

function photos(value: unknown): Photo[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((p): p is Photo => !!p && typeof p === "object" && typeof (p as Photo).url === "string")
    .map((p) => ({ url: str(p.url, 1000), pathname: str(p.pathname, 400) }))
    .slice(0, 24);
}

function isoDate(value: unknown): string {
  const s = str(value, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : todayLocal();
}

/**
 * Coerces whatever the form posted into a well-formed Recipe. Anything we
 * don't recognise is dropped rather than rejected. A typo in one optional
 * field should never cost you the recipe you just typed out.
 */
export function normalizeRecipe(raw: unknown, existing?: Recipe): Recipe | { error: string } {
  const input = (raw ?? {}) as Record<string, unknown>;
  const title = str(input.title, 160);
  if (!title) return { error: "Give the recipe a name." };

  const now = Date.now();
  const allowedMethods = new Set<string>(METHODS);

  return {
    id: existing?.id ?? crypto.randomUUID(),
    title,
    rating: num(input.rating, 0, 10),
    difficulty: num(input.difficulty, 1, 5),
    servings: num(input.servings, 0, 999),
    methods: strList(input.methods, 12).filter((m) => allowedMethods.has(m)),
    activeMinutes: num(input.activeMinutes, 0, 10000),
    totalMinutes: num(input.totalMinutes, 0, 100000),
    cost: num(input.cost, 0, 100000),
    cuisine: str(input.cuisine, 40),
    protein: str(input.protein, 40),
    tags: strList(input.tags, 20),
    wouldMakeAgain: typeof input.wouldMakeAgain === "boolean" ? input.wouldMakeAgain : null,
    sourceName: str(input.sourceName, 120),
    sourceUrl: safeUrl(input.sourceUrl),
    ingredients: strList(input.ingredients, 100),
    steps: strList(input.steps, 60),
    notes: str(input.notes, 5000),
    photos: photos(input.photos),
    madeOn: isoDate(input.madeOn),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
}

/** Only http(s) links, so a pasted source can't become a javascript: URL. */
function safeUrl(value: unknown): string {
  const s = str(value, 800);
  if (!s) return "";
  const withScheme = /^https?:\/\//i.test(s) ? s : `https://${s}`;
  try {
    const url = new URL(withScheme);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : "";
  } catch {
    return "";
  }
}

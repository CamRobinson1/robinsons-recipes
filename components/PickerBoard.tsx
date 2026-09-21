"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Bowl, Cart, Clock, Dice, Flame, Repeat } from "./Icons";
import { DIFFICULTY_LABELS, METHODS } from "@/lib/constants";
import { formatMinutes, formatRating } from "@/lib/format";
import { MEAL_LABELS, MEAL_SLOTS, slotKey, todayLocal, type MealSlot, type MenuEntry } from "@/lib/types";
import { thisWeekStart } from "@/lib/week";

type Candidate = {
  id: string;
  title: string;
  rating: number | null;
  difficulty: number | null;
  totalMinutes: number | null;
  servings: number | null;
  methods: string[];
  tags: string[];
  wouldMakeAgain: boolean | null;
  photo: string;
};

const TIME_LIMITS = [
  { label: "However long", value: 0 },
  { label: "Under 30 min", value: 30 },
  { label: "Under 45 min", value: 45 },
  { label: "Under 1 hour", value: 60 },
];

const RATING_FLOORS = [
  { label: "Any score", value: 0 },
  { label: "7+", value: 7 },
  { label: "8+", value: 8 },
  { label: "9+", value: 9 },
];

export default function PickerBoard({ recipes }: { recipes: Candidate[] }) {
  const [maxTime, setMaxTime] = useState(0);
  const [minRating, setMinRating] = useState(0);
  const [method, setMethod] = useState("");
  const [keepersOnly, setKeepersOnly] = useState(false);
  const [picked, setPicked] = useState<Candidate | null>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const available = useMemo(() => {
    const seen = new Set(recipes.flatMap((r) => r.methods));
    return METHODS.filter((m) => seen.has(m));
  }, [recipes]);

  const pool = useMemo(
    () =>
      recipes.filter((recipe) => {
        if (minRating && (recipe.rating ?? -1) < minRating) return false;
        if (maxTime && (recipe.totalMinutes === null || recipe.totalMinutes > maxTime)) return false;
        if (method && !recipe.methods.includes(method)) return false;
        if (keepersOnly && recipe.wouldMakeAgain !== true) return false;
        return true;
      }),
    [recipes, minRating, maxTime, method, keepersOnly]
  );

  function spin() {
    setStatus("");
    if (pool.length === 0) {
      setPicked(null);
      return;
    }
    // Don't hand back the same one twice in a row when there's a real choice.
    const choices = pool.length > 1 && picked ? pool.filter((r) => r.id !== picked.id) : pool;
    setPicked(choices[Math.floor(Math.random() * choices.length)] ?? null);
  }

  /** Drops the pick straight into today's slot on this week's menu. */
  async function planFor(slot: MealSlot) {
    if (!picked) return;
    setBusy(true);
    setStatus("");

    const week = thisWeekStart();
    try {
      const current = await fetch(`/api/menu?week=${week}`, { cache: "no-store" });
      const data = (await current.json()) as { menu: { entries: Record<string, MenuEntry> } };

      const entries = {
        ...data.menu.entries,
        [slotKey(todayLocal(), slot)]: { recipeId: picked.id, title: picked.title },
      };

      const res = await fetch(`/api/menu?week=${week}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries }),
      });
      if (!res.ok) throw new Error();
      setStatus(`Put on today's ${MEAL_LABELS[slot].toLowerCase()}.`);
    } catch {
      setStatus("Couldn't reach the menu.");
    } finally {
      setBusy(false);
    }
  }

  async function addToList() {
    if (!picked) return;
    setBusy(true);
    setStatus("");

    try {
      const res = await fetch("/api/shopping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeIds: [picked.id] }),
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { added: number };
      setStatus(
        data.added === 0
          ? "Those ingredients are already on the list."
          : `Added ${data.added} ingredient${data.added === 1 ? "" : "s"} to the shopping list.`
      );
    } catch {
      setStatus("Couldn't reach the shopping list.");
    } finally {
      setBusy(false);
    }
  }

  if (recipes.length === 0) {
    return (
      <div className="empty-state">
        <h2>Nothing to pick from</h2>
        <p>Add a few recipes first and this will choose one for you.</p>
        <Link href="/new" className="btn btn-primary btn-lg" style={{ marginTop: 16 }}>
          Add a recipe
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">What should we make?</h1>
          <p className="page-sub">
            {pool.length} recipe{pool.length === 1 ? "" : "s"} fit what you&rsquo;re after.
          </p>
        </div>
      </div>

      <div className="card filter-panel" style={{ marginBottom: 20 }}>
        <div className="filter-group">
          <span className="filter-label">Time</span>
          {TIME_LIMITS.map((option) => (
            <button
              key={option.value}
              type="button"
              className="chip chip-toggle"
              aria-pressed={maxTime === option.value}
              onClick={() => setMaxTime(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="filter-group">
          <span className="filter-label">Score</span>
          {RATING_FLOORS.map((option) => (
            <button
              key={option.value}
              type="button"
              className="chip chip-toggle"
              aria-pressed={minRating === option.value}
              onClick={() => setMinRating(option.value)}
            >
              {option.label}
            </button>
          ))}
          <button
            type="button"
            className="chip chip-toggle"
            aria-pressed={keepersOnly}
            onClick={() => setKeepersOnly((v) => !v)}
          >
            Keepers only
          </button>
        </div>

        {available.length > 0 && (
          <div className="filter-group">
            <span className="filter-label">Method</span>
            <button
              type="button"
              className="chip chip-toggle"
              aria-pressed={method === ""}
              onClick={() => setMethod("")}
            >
              Any
            </button>
            {available.map((m) => (
              <button
                key={m}
                type="button"
                className="chip chip-toggle"
                aria-pressed={method === m}
                onClick={() => setMethod(m)}
              >
                {m}
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ textAlign: "center", marginBottom: 22 }}>
        <button type="button" className="btn btn-primary btn-lg" onClick={spin} disabled={pool.length === 0}>
          <Dice />
          {picked ? "Pick another" : "Pick one for us"}
        </button>
      </div>

      {pool.length === 0 && (
        <div className="empty-state">
          <h2>Nothing fits</h2>
          <p>Loosen a filter and try again.</p>
        </div>
      )}

      {picked && (
        <div className="card pick-card">
          {picked.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={picked.photo} alt="" className="pick-photo" />
          ) : (
            <div className="pick-photo recipe-photo-empty">
              <Bowl size={52} />
            </div>
          )}

          <div className="pick-body">
            <h2 style={{ fontSize: 26, letterSpacing: "-0.02em" }}>{picked.title}</h2>

            <div className="recipe-meta" style={{ marginTop: 8 }}>
              {picked.rating !== null && (
                <span>
                  <Flame />
                  {formatRating(picked.rating)}/10
                </span>
              )}
              {picked.totalMinutes !== null && (
                <span>
                  <Clock />
                  {formatMinutes(picked.totalMinutes)}
                </span>
              )}
              {picked.servings ? (
                <span>
                  <Bowl />
                  {picked.servings} meals
                </span>
              ) : null}
              {picked.difficulty !== null && <span>{DIFFICULTY_LABELS[picked.difficulty]}</span>}
              {picked.wouldMakeAgain === true && (
                <span>
                  <Repeat />
                  Keeper
                </span>
              )}
            </div>

            {picked.methods.length > 0 && (
              <div className="chip-row" style={{ marginTop: 12 }}>
                {picked.methods.map((m) => (
                  <span key={m} className="chip chip-method">
                    {m}
                  </span>
                ))}
                {picked.tags.map((t) => (
                  <span key={t} className="chip chip-tag">
                    {t}
                  </span>
                ))}
              </div>
            )}

            <div className="pick-actions">
              <Link href={`/recipe/${picked.id}`} className="btn btn-primary">
                Open the recipe
              </Link>
              <button type="button" className="btn" onClick={addToList} disabled={busy}>
                <Cart />
                Add ingredients
              </button>
            </div>

            <div className="pick-plan">
              <span className="field-hint">Put it on today&rsquo;s menu:</span>
              {MEAL_SLOTS.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  className="btn btn-sm"
                  disabled={busy}
                  onClick={() => planFor(slot)}
                >
                  {MEAL_LABELS[slot]}
                </button>
              ))}
            </div>

            {status && <p className="pick-status">{status}</p>}
          </div>
        </div>
      )}

      <div style={{ height: 50 }} />
    </>
  );
}

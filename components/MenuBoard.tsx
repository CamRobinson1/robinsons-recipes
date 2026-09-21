"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Cart, ChevronLeft, ChevronRight, Plus, Search, X } from "./Icons";
import { formatMinutes, formatRating } from "@/lib/format";
import { MEAL_LABELS, MEAL_SLOTS, slotKey, todayLocal, type MealSlot, type MenuEntry } from "@/lib/types";
import { dayLabel, shiftWeek, thisWeekStart, weekDates, weekRangeLabel } from "@/lib/week";

type Option = {
  id: string;
  title: string;
  rating: number | null;
  totalMinutes: number | null;
};

export default function MenuBoard({
  weekStart,
  initialEntries,
  recipes,
}: {
  weekStart: string;
  initialEntries: Record<string, MenuEntry>;
  recipes: Option[];
}) {
  const router = useRouter();
  const [entries, setEntries] = useState(initialEntries);
  const [picking, setPicking] = useState<{ date: string; slot: MealSlot } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState("");

  const saveToken = useRef(0);
  const dates = useMemo(() => weekDates(weekStart), [weekStart]);
  const today = todayLocal();

  function commit(next: Record<string, MenuEntry>) {
    setEntries(next);
    setError("");
    const token = ++saveToken.current;
    setSaving(true);

    void fetch(`/api/menu?week=${weekStart}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entries: next }),
    })
      .then((res) => {
        if (!res.ok) throw new Error();
      })
      .catch(() => {
        if (token === saveToken.current) setError("That didn't save. Check your connection.");
      })
      .finally(() => {
        if (token === saveToken.current) setSaving(false);
      });
  }

  function assign(date: string, slot: MealSlot, entry: MenuEntry) {
    commit({ ...entries, [slotKey(date, slot)]: entry });
    setPicking(null);
  }

  function clear(date: string, slot: MealSlot) {
    const next = { ...entries };
    delete next[slotKey(date, slot)];
    commit(next);
  }

  const plannedRecipeIds = useMemo(
    () => [...new Set(Object.values(entries).map((e) => e.recipeId).filter(Boolean))],
    [entries]
  );

  async function sendWeekToList() {
    setSent("");
    const res = await fetch("/api/shopping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipeIds: plannedRecipeIds }),
    });

    if (!res.ok) {
      setError("Couldn't reach the shopping list.");
      return;
    }

    const data = (await res.json()) as { added: number; skipped: number };
    setSent(
      data.added === 0
        ? "Everything for this week is already on the list."
        : `Added ${data.added} item${data.added === 1 ? "" : "s"}${
            data.skipped ? `, skipped ${data.skipped} already there` : ""
          }.`
    );
  }

  const filled = Object.keys(entries).length;

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">{weekStart === thisWeekStart() ? "This week" : "The week of"}</h1>
          <p className="page-sub">
            {weekRangeLabel(weekStart)} · {filled} of 21 meals planned
            {saving && " · saving"}
          </p>
        </div>

        <div className="week-controls">
          <button
            type="button"
            className="btn icon-btn"
            aria-label="Previous week"
            onClick={() => router.push(`/menu?week=${shiftWeek(weekStart, -1)}`)}
          >
            <ChevronLeft />
          </button>
          <button
            type="button"
            className="btn btn-sm"
            disabled={weekStart === thisWeekStart()}
            onClick={() => router.push("/menu")}
          >
            Today
          </button>
          <button
            type="button"
            className="btn icon-btn"
            aria-label="Next week"
            onClick={() => router.push(`/menu?week=${shiftWeek(weekStart, 1)}`)}
          >
            <ChevronRight />
          </button>
          <button
            type="button"
            className="btn"
            disabled={plannedRecipeIds.length === 0}
            onClick={sendWeekToList}
          >
            <Cart />
            <span>Send to shopping list</span>
          </button>
        </div>
      </div>

      {error && <p className="error-text">{error}</p>}
      {sent && <p className="banner">{sent}</p>}

      <div className="menu-grid">
        <div className="menu-corner" aria-hidden />
        {MEAL_SLOTS.map((slot) => (
          <div key={slot} className="menu-head">
            {MEAL_LABELS[slot]}
          </div>
        ))}

        {dates.map((date) => {
          const { weekday, date: dayNumber } = dayLabel(date);
          return (
            <div key={date} className="menu-row" data-today={date === today}>
              <div className="menu-day">
                <span className="menu-weekday">{weekday}</span>
                <span className="menu-date">{dayNumber}</span>
                {date === today && <span className="menu-today-flag">Today</span>}
              </div>

              {MEAL_SLOTS.map((slot) => {
                const entry = entries[slotKey(date, slot)];
                return (
                  <div key={slot} className="menu-cell">
                    <span className="menu-cell-label">{MEAL_LABELS[slot]}</span>
                    {entry ? (
                      <div className="menu-entry">
                        {entry.recipeId ? (
                          <Link href={`/recipe/${entry.recipeId}`} className="menu-entry-title">
                            {entry.title}
                          </Link>
                        ) : (
                          <span className="menu-entry-title menu-entry-plain">{entry.title}</span>
                        )}
                        <button
                          type="button"
                          className="menu-entry-clear"
                          aria-label={`Clear ${MEAL_LABELS[slot]} on ${weekday}`}
                          onClick={() => clear(date, slot)}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="menu-add"
                        aria-label={`Plan ${MEAL_LABELS[slot]} for ${weekday} ${dayNumber}`}
                        onClick={() => setPicking({ date, slot })}
                      >
                        <Plus size={15} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {picking && (
        <SlotPicker
          recipes={recipes}
          label={`${MEAL_LABELS[picking.slot]}, ${dayLabel(picking.date).weekday} ${dayLabel(picking.date).date}`}
          onClose={() => setPicking(null)}
          onPick={(entry) => assign(picking.date, picking.slot, entry)}
        />
      )}

      <div style={{ height: 50 }} />
    </>
  );
}

function SlotPicker({
  recipes,
  label,
  onPick,
  onClose,
}: {
  recipes: Option[];
  label: string;
  onPick: (entry: MenuEntry) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Explicit focus rather than relying on autoFocus, so you can open a slot
    // and start typing straight away.
    inputRef.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pool = q ? recipes.filter((r) => r.title.toLowerCase().includes(q)) : recipes;
    return pool.slice(0, 40);
  }, [recipes, query]);

  const trimmed = query.trim();

  return (
    <div className="sheet-backdrop" onClick={onClose} role="presentation">
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={`Plan ${label}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-head">
          <div>
            <h2 style={{ fontSize: 19 }}>Plan {label}</h2>
            <p className="field-hint">Pick a recipe, or write in anything else.</p>
          </div>
          <button type="button" className="btn btn-ghost icon-btn" aria-label="Close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="search-box" style={{ margin: "4px 0 12px" }}>
          <Search />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search recipes, or type leftovers, takeout…"
            aria-label="Search recipes"
          />
        </div>

        {trimmed && (
          <button
            type="button"
            className="sheet-option sheet-option-plain"
            onClick={() => onPick({ recipeId: "", title: trimmed })}
          >
            <Plus size={14} />
            <span>
              Write in &ldquo;<b>{trimmed}</b>&rdquo;
            </span>
          </button>
        )}

        <div className="sheet-list">
          {matches.map((recipe) => (
            <button
              key={recipe.id}
              type="button"
              className="sheet-option"
              onClick={() => onPick({ recipeId: recipe.id, title: recipe.title })}
            >
              <span className="sheet-option-title">{recipe.title}</span>
              <span className="sheet-option-meta">
                {recipe.rating !== null && `${formatRating(recipe.rating)}/10`}
                {recipe.rating !== null && recipe.totalMinutes !== null && " · "}
                {formatMinutes(recipe.totalMinutes)}
              </span>
            </button>
          ))}
          {matches.length === 0 && (
            <p className="field-hint" style={{ padding: "10px 2px" }}>
              {recipes.length === 0
                ? "No recipes in the cookbook yet."
                : "No recipe matches. You can still write it in above."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

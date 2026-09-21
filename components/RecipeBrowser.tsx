"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import RecipeCard from "./RecipeCard";
import { Plus, Search, Sliders } from "./Icons";
import { CUISINES, METHODS, PROTEINS, TAGS } from "@/lib/constants";
import { formatRating } from "@/lib/format";
import type { Recipe } from "@/lib/types";

type Sort = "recent" | "rating" | "quickest" | "easiest" | "alpha";

const TIME_LIMITS = [
  { label: "Any time", value: 0 },
  { label: "Under 30 min", value: 30 },
  { label: "Under 45 min", value: 45 },
  { label: "Under 1 hour", value: 60 },
  { label: "Under 2 hours", value: 120 },
];

const RATING_FLOORS = [
  { label: "Any score", value: 0 },
  { label: "7+", value: 7 },
  { label: "8+", value: 8 },
  { label: "9+", value: 9 },
];

export default function RecipeBrowser({ recipes }: { recipes: Recipe[] }) {
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [methods, setMethods] = useState<string[]>([]);
  const [tag, setTag] = useState("");
  const [protein, setProtein] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [minRating, setMinRating] = useState(0);
  const [maxTime, setMaxTime] = useState(0);
  const [keepersOnly, setKeepersOnly] = useState(false);
  const [sort, setSort] = useState<Sort>("recent");

  // Only offer filter values that actually exist in the collection.
  const available = useMemo(() => {
    const seen = { methods: new Set<string>(), tags: new Set<string>(), proteins: new Set<string>(), cuisines: new Set<string>() };
    for (const r of recipes) {
      r.methods.forEach((m) => seen.methods.add(m));
      r.tags.forEach((t) => seen.tags.add(t));
      if (r.protein) seen.proteins.add(r.protein);
      if (r.cuisine) seen.cuisines.add(r.cuisine);
    }
    return {
      methods: METHODS.filter((m) => seen.methods.has(m)),
      tags: TAGS.filter((t) => seen.tags.has(t)).concat([...seen.tags].filter((t) => !TAGS.includes(t)).sort()),
      proteins: PROTEINS.filter((p) => seen.proteins.has(p)),
      cuisines: CUISINES.filter((c) => seen.cuisines.has(c)),
    };
  }, [recipes]);

  const stats = useMemo(() => {
    const rated = recipes.filter((r) => r.rating !== null);
    const avg = rated.length ? rated.reduce((sum, r) => sum + (r.rating ?? 0), 0) / rated.length : null;
    const keepers = recipes.filter((r) => r.wouldMakeAgain === true).length;

    const counts = new Map<string, number>();
    for (const r of recipes) for (const m of r.methods) counts.set(m, (counts.get(m) ?? 0) + 1);
    const topMethod = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "None yet";

    return { total: recipes.length, avg, keepers, topMethod };
  }, [recipes]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    const matches = recipes.filter((r) => {
      if (q) {
        const haystack = [r.title, r.cuisine, r.protein, r.notes, r.sourceName, ...r.tags, ...r.ingredients]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (methods.length && !methods.some((m) => r.methods.includes(m))) return false;
      if (tag && !r.tags.includes(tag)) return false;
      if (protein && r.protein !== protein) return false;
      if (cuisine && r.cuisine !== cuisine) return false;
      if (minRating && (r.rating ?? -1) < minRating) return false;
      if (maxTime) {
        const t = r.totalMinutes ?? r.activeMinutes;
        if (t === null || t > maxTime) return false;
      }
      if (keepersOnly && r.wouldMakeAgain !== true) return false;
      return true;
    });

    const sorted = [...matches];
    if (sort === "rating") sorted.sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1));
    else if (sort === "quickest")
      sorted.sort((a, b) => (a.totalMinutes ?? Infinity) - (b.totalMinutes ?? Infinity));
    else if (sort === "easiest") sorted.sort((a, b) => (a.difficulty ?? 99) - (b.difficulty ?? 99));
    else if (sort === "alpha") sorted.sort((a, b) => a.title.localeCompare(b.title));
    // "recent" keeps the order the server already sorted by (newest cooked first).

    return sorted;
  }, [recipes, query, methods, tag, protein, cuisine, minRating, maxTime, keepersOnly, sort]);

  const filtersActive =
    methods.length > 0 || !!tag || !!protein || !!cuisine || minRating > 0 || maxTime > 0 || keepersOnly;

  function toggleMethod(method: string) {
    setMethods((current) =>
      current.includes(method) ? current.filter((m) => m !== method) : [...current, method]
    );
  }

  function clearFilters() {
    setMethods([]);
    setTag("");
    setProtein("");
    setCuisine("");
    setMinRating(0);
    setMaxTime(0);
    setKeepersOnly(false);
  }

  if (recipes.length === 0) {
    return (
      <div className="empty-state">
        <h2>Nothing in the book yet</h2>
        <p style={{ maxWidth: 380, margin: "0 auto 20px" }}>
          Add the first thing you cooked. Snap a photo, give it a score out of 10, and it&rsquo;s saved for good.
        </p>
        <Link href="/new" className="btn btn-primary btn-lg">
          <Plus />
          Add your first recipe
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">The cookbook</h1>
          <p className="page-sub">
            {filtered.length === recipes.length
              ? `${recipes.length} ${recipes.length === 1 ? "recipe" : "recipes"} logged`
              : `${filtered.length} of ${recipes.length} recipes`}
          </p>
        </div>
      </div>

      <div className="stat-strip">
        <div className="stat">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Recipes</div>
        </div>
        <div className="stat">
          <div className="stat-value">{stats.avg === null ? "n/a" : formatRating(Math.round(stats.avg * 10) / 10)}</div>
          <div className="stat-label">Avg score</div>
        </div>
        <div className="stat">
          <div className="stat-value">{stats.keepers}</div>
          <div className="stat-label">Keepers</div>
        </div>
        <div className="stat">
          <div className="stat-value" style={{ fontSize: 19, paddingTop: 5 }}>
            {stats.topMethod}
          </div>
          <div className="stat-label">Go-to method</div>
        </div>
      </div>

      <div className="toolbar">
        <div className="search-row">
          <div className="search-box">
            <Search />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search recipes, ingredients, notes…"
              aria-label="Search recipes"
            />
          </div>
          <button
            type="button"
            className="btn"
            aria-expanded={showFilters}
            onClick={() => setShowFilters((v) => !v)}
          >
            <Sliders />
            <span>Filters{filtersActive ? " •" : ""}</span>
          </button>
        </div>

        {showFilters && (
          <div className="card filter-panel">
            <div className="filter-group">
              <span className="filter-label">Method</span>
              {available.methods.map((m) => (
                <button
                  key={m}
                  type="button"
                  className="chip chip-toggle"
                  aria-pressed={methods.includes(m)}
                  onClick={() => toggleMethod(m)}
                >
                  {m}
                </button>
              ))}
              {available.methods.length === 0 && <span className="field-hint">No methods recorded yet.</span>}
            </div>

            <div className="filter-group">
              <span className="filter-label">Narrow</span>

              <select className="select" value={minRating} onChange={(e) => setMinRating(Number(e.target.value))}>
                {RATING_FLOORS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>

              <select className="select" value={maxTime} onChange={(e) => setMaxTime(Number(e.target.value))}>
                {TIME_LIMITS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>

              {available.proteins.length > 0 && (
                <select className="select" value={protein} onChange={(e) => setProtein(e.target.value)}>
                  <option value="">Any protein</option>
                  {available.proteins.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              )}

              {available.cuisines.length > 0 && (
                <select className="select" value={cuisine} onChange={(e) => setCuisine(e.target.value)}>
                  <option value="">Any cuisine</option>
                  {available.cuisines.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              )}

              {available.tags.length > 0 && (
                <select className="select" value={tag} onChange={(e) => setTag(e.target.value)}>
                  <option value="">Any tag</option>
                  {available.tags.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              )}

              <button
                type="button"
                className="chip chip-toggle"
                aria-pressed={keepersOnly}
                onClick={() => setKeepersOnly((v) => !v)}
              >
                Would make again
              </button>
            </div>

            <div className="filter-group">
              <span className="filter-label">Sort</span>
              <select className="select" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
                <option value="recent">Most recently made</option>
                <option value="rating">Highest rated</option>
                <option value="quickest">Quickest</option>
                <option value="easiest">Easiest</option>
                <option value="alpha">A to Z</option>
              </select>
              {filtersActive && (
                <button type="button" className="btn btn-ghost btn-sm" onClick={clearFilters}>
                  Clear filters
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <h2>Nothing matches</h2>
          <p>Try loosening the filters or searching for something else.</p>
        </div>
      ) : (
        <div className="recipe-grid">
          {filtered.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}

      <div style={{ height: 40 }} />
    </>
  );
}

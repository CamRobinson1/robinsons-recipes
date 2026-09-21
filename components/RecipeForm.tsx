"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import PhotoUploader from "./PhotoUploader";
import { ArrowLeft, Trash } from "./Icons";
import { CUISINES, DIFFICULTY_LABELS, METHODS, PROTEINS, TAGS } from "@/lib/constants";
import { emptyRecipe, type Photo, type Recipe, type RecipeInput } from "@/lib/types";

const RATINGS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

/** Number inputs hand back strings; empty means "not recorded", not zero. */
function toNumber(value: string): number | null {
  if (value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function fromNumber(value: number | null): string {
  return value === null ? "" : String(value);
}

function toLines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export default function RecipeForm({ recipe }: { recipe?: Recipe }) {
  const router = useRouter();
  const [form, setForm] = useState<RecipeInput>(() => recipe ?? emptyRecipe());
  const [ingredientsText, setIngredientsText] = useState(() => (recipe?.ingredients ?? []).join("\n"));
  const [stepsText, setStepsText] = useState(() => (recipe?.steps ?? []).join("\n"));
  const [customTag, setCustomTag] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  function set<K extends keyof RecipeInput>(key: K, value: RecipeInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleIn(key: "methods" | "tags", value: string) {
    setForm((current) => {
      const list = current[key];
      return {
        ...current,
        [key]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value],
      };
    });
  }

  function setPhotos(update: (current: Photo[]) => Photo[]) {
    setForm((current) => ({ ...current, photos: update(current.photos) }));
  }

  function addCustomTag() {
    const tag = customTag.trim();
    if (!tag) return;
    setForm((current) =>
      current.tags.includes(tag) ? current : { ...current, tags: [...current.tags, tag] }
    );
    setCustomTag("");
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!form.title.trim()) {
      setError("Give the recipe a name.");
      return;
    }

    setSaving(true);
    setError("");

    const payload = {
      ...form,
      ingredients: toLines(ingredientsText),
      steps: toLines(stepsText),
    };

    const res = await fetch(recipe ? `/api/recipes/${recipe.id}` : "/api/recipes", {
      method: recipe ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = (await res.json().catch(() => ({}))) as { recipe?: Recipe; error?: string };

    if (!res.ok || !data.recipe) {
      setError(data.error ?? "Couldn't save that. Try again.");
      setSaving(false);
      return;
    }

    router.push(`/recipe/${data.recipe.id}`);
    router.refresh();
  }

  async function remove() {
    if (!recipe) return;
    if (!confirm(`Delete "${recipe.title}"? This can't be undone.`)) return;
    setDeleting(true);
    await fetch(`/api/recipes/${recipe.id}`, { method: "DELETE" });
    router.push("/");
    router.refresh();
  }

  const customTags = form.tags.filter((t) => !TAGS.includes(t));

  return (
    <form onSubmit={save}>
      <Link href={recipe ? `/recipe/${recipe.id}` : "/"} className="back-link">
        <ArrowLeft />
        {recipe ? "Back to recipe" : "Back to cookbook"}
      </Link>

      <div className="page-head">
        <div>
          <h1 className="page-title">{recipe ? "Edit recipe" : "New recipe"}</h1>
          <p className="page-sub">Only the name is required. Fill in the rest as you remember it.</p>
        </div>
      </div>

      <section className="card form-section">
        <div className="form-section-title">The dish</div>

        <div className="field">
          <label htmlFor="title">Name</label>
          <input
            id="title"
            className="input"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="Sunday short rib ragu"
            autoFocus={!recipe}
          />
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="madeOn">Date made</label>
            <input
              id="madeOn"
              className="input"
              type="date"
              value={form.madeOn}
              onChange={(e) => set("madeOn", e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="servings">How many meals it made</label>
            <input
              id="servings"
              className="input"
              type="number"
              inputMode="numeric"
              min={0}
              value={fromNumber(form.servings)}
              onChange={(e) => set("servings", toNumber(e.target.value))}
              placeholder="4"
            />
          </div>
        </div>

        <PhotoUploader photos={form.photos} onChange={setPhotos} />
      </section>

      <section className="card form-section">
        <div className="form-section-title">The verdict</div>

        <div className="field">
          <span className="field-label">Score out of 10</span>
          <div className="rating-picker">
            {RATINGS.map((n) => (
              <button
                key={n}
                type="button"
                className="rating-dot"
                aria-pressed={form.rating === n}
                aria-label={`${n} out of 10`}
                onClick={() => set("rating", form.rating === n ? null : n)}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <span className="field-label">How easy was it?</span>
          <div className="difficulty-picker">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                className="chip chip-toggle"
                aria-pressed={form.difficulty === n}
                onClick={() => set("difficulty", form.difficulty === n ? null : n)}
              >
                {DIFFICULTY_LABELS[n]}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <span className="field-label">Would we make it again?</span>
          <div className="difficulty-picker">
            <button
              type="button"
              className="chip chip-toggle"
              aria-pressed={form.wouldMakeAgain === true}
              onClick={() => set("wouldMakeAgain", form.wouldMakeAgain === true ? null : true)}
            >
              Yes, keeper
            </button>
            <button
              type="button"
              className="chip chip-toggle"
              aria-pressed={form.wouldMakeAgain === false}
              onClick={() => set("wouldMakeAgain", form.wouldMakeAgain === false ? null : false)}
            >
              Nope
            </button>
          </div>
        </div>
      </section>

      <section className="card form-section">
        <div className="form-section-title">How it was cooked</div>

        <div className="field">
          <span className="field-label">Method</span>
          <span className="field-hint">Pick every one you used.</span>
          <div className="difficulty-picker">
            {METHODS.map((m) => (
              <button
                key={m}
                type="button"
                className="chip chip-toggle"
                aria-pressed={form.methods.includes(m)}
                onClick={() => toggleIn("methods", m)}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="activeMinutes">Hands-on time (min)</label>
            <input
              id="activeMinutes"
              className="input"
              type="number"
              inputMode="numeric"
              min={0}
              value={fromNumber(form.activeMinutes)}
              onChange={(e) => set("activeMinutes", toNumber(e.target.value))}
              placeholder="25"
            />
          </div>
          <div className="field">
            <label htmlFor="totalMinutes">Total time (min)</label>
            <input
              id="totalMinutes"
              className="input"
              type="number"
              inputMode="numeric"
              min={0}
              value={fromNumber(form.totalMinutes)}
              onChange={(e) => set("totalMinutes", toNumber(e.target.value))}
              placeholder="90"
            />
          </div>
          <div className="field">
            <label htmlFor="cost">Rough cost ($)</label>
            <input
              id="cost"
              className="input"
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              value={fromNumber(form.cost)}
              onChange={(e) => set("cost", toNumber(e.target.value))}
              placeholder="22"
            />
          </div>
        </div>
      </section>

      <section className="card form-section">
        <div className="form-section-title">Filing it away</div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="cuisine">Cuisine</label>
            <select
              id="cuisine"
              className="input"
              value={form.cuisine}
              onChange={(e) => set("cuisine", e.target.value)}
            >
              <option value="">Not sure</option>
              {CUISINES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="protein">Main protein</label>
            <select
              id="protein"
              className="input"
              value={form.protein}
              onChange={(e) => set("protein", e.target.value)}
            >
              <option value="">Not sure</option>
              {PROTEINS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="field">
          <span className="field-label">Tags</span>
          <div className="difficulty-picker">
            {TAGS.map((t) => (
              <button
                key={t}
                type="button"
                className="chip chip-toggle"
                aria-pressed={form.tags.includes(t)}
                onClick={() => toggleIn("tags", t)}
              >
                {t}
              </button>
            ))}
            {customTags.map((t) => (
              <button
                key={t}
                type="button"
                className="chip chip-toggle"
                aria-pressed
                onClick={() => toggleIn("tags", t)}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="list-editor-row" style={{ marginTop: 4 }}>
            <input
              className="input"
              value={customTag}
              onChange={(e) => setCustomTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCustomTag();
                }
              }}
              placeholder="Add your own tag"
            />
            <button type="button" className="btn" onClick={addCustomTag} disabled={!customTag.trim()}>
              Add
            </button>
          </div>
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="sourceName">Where it came from</label>
            <input
              id="sourceName"
              className="input"
              value={form.sourceName}
              onChange={(e) => set("sourceName", e.target.value)}
              placeholder="Mom, NYT Cooking, made it up…"
            />
          </div>
          <div className="field">
            <label htmlFor="sourceUrl">Link</label>
            {/* Deliberately type="text": a link pasted without https:// would fail
                native URL validation and silently block the save. The server adds
                the scheme and rejects anything that isn't http(s). */}
            <input
              id="sourceUrl"
              className="input"
              type="text"
              inputMode="url"
              value={form.sourceUrl}
              onChange={(e) => set("sourceUrl", e.target.value)}
              placeholder="https://…"
            />
          </div>
        </div>
      </section>

      <section className="card form-section">
        <div className="form-section-title">The recipe</div>

        <div className="field">
          <label htmlFor="ingredients">Ingredients</label>
          <span className="field-hint">One per line.</span>
          <textarea
            id="ingredients"
            className="textarea"
            rows={8}
            value={ingredientsText}
            onChange={(e) => setIngredientsText(e.target.value)}
            placeholder={"2 lb short rib\n1 yellow onion, diced\n3 cloves garlic"}
          />
        </div>

        <div className="field">
          <label htmlFor="steps">Steps</label>
          <span className="field-hint">One per line. They get numbered for you.</span>
          <textarea
            id="steps"
            className="textarea"
            rows={8}
            value={stepsText}
            onChange={(e) => setStepsText(e.target.value)}
            placeholder={"Sear the beef on all sides.\nSoften the onion and garlic.\nBraise at 300F for 3 hours."}
          />
        </div>

        <div className="field">
          <label htmlFor="notes">Notes for next time</label>
          <textarea
            id="notes"
            className="textarea"
            rows={4}
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="Double the sauce. Needed another 30 minutes."
          />
        </div>
      </section>

      <div className="form-actions">
        {error && <span className="error-text">{error}</span>}
        {recipe && (
          <button type="button" className="btn btn-danger" onClick={remove} disabled={deleting || saving}>
            <Trash />
            {deleting ? "Deleting…" : "Delete"}
          </button>
        )}
        <Link href={recipe ? `/recipe/${recipe.id}` : "/"} className="btn btn-ghost">
          Cancel
        </Link>
        <button type="submit" className="btn btn-primary btn-lg" disabled={saving || deleting}>
          {saving ? "Saving…" : recipe ? "Save changes" : "Add to the cookbook"}
        </button>
      </div>
    </form>
  );
}

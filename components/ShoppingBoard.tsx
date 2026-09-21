"use client";

import { useMemo, useRef, useState } from "react";
import { Check, Plus, Trash, X } from "./Icons";
import type { ShoppingItem } from "@/lib/types";

export default function ShoppingBoard({ initialItems }: { initialItems: ShoppingItem[] }) {
  const [items, setItems] = useState<ShoppingItem[]>(initialItems);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Only the newest save matters, so an older reply can't overwrite a newer edit.
  const saveToken = useRef(0);

  /** Optimistic: update on screen first, then push the whole list to the server. */
  function commit(next: ShoppingItem[]) {
    setItems(next);
    setError("");
    const token = ++saveToken.current;
    setSaving(true);

    void fetch("/api/shopping", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: next }),
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

  function add() {
    // One line per item, so pasting a block of ingredients works.
    const lines = draft
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines.length === 0) return;

    const existing = new Set(items.map((item) => item.text.toLowerCase()));
    const fresh = lines
      .filter((line) => !existing.has(line.toLowerCase()))
      .map((line) => ({ id: crypto.randomUUID(), text: line, checked: false, source: "" }));

    if (fresh.length > 0) commit([...items, ...fresh]);
    setDraft("");
  }

  const { open, done } = useMemo(
    () => ({
      open: items.filter((item) => !item.checked),
      done: items.filter((item) => item.checked),
    }),
    [items]
  );

  function row(item: ShoppingItem) {
    return (
      <li key={item.id} className="list-item" data-checked={item.checked}>
        <button
          type="button"
          className="list-check"
          aria-pressed={item.checked}
          aria-label={item.checked ? `Uncheck ${item.text}` : `Check off ${item.text}`}
          onClick={() =>
            commit(items.map((i) => (i.id === item.id ? { ...i, checked: !i.checked } : i)))
          }
        >
          {item.checked && <Check size={13} />}
        </button>
        <span className="list-text">
          {item.text}
          {item.source && <span className="list-source">{item.source}</span>}
        </span>
        <button
          type="button"
          className="list-remove"
          aria-label={`Remove ${item.text}`}
          onClick={() => commit(items.filter((i) => i.id !== item.id))}
        >
          <X size={13} />
        </button>
      </li>
    );
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Shopping list</h1>
          <p className="page-sub">
            {items.length === 0
              ? "Nothing on it yet."
              : `${open.length} to get${done.length ? `, ${done.length} in the cart` : ""}`}
            {saving && " · saving"}
          </p>
        </div>
        {done.length > 0 && (
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => commit(items.filter((item) => !item.checked))}
          >
            <Trash size={14} />
            Clear checked
          </button>
        )}
      </div>

      {error && <p className="error-text">{error}</p>}

      <div className="card" style={{ padding: "14px 16px", marginBottom: 18 }}>
        <div className="list-editor-row">
          <textarea
            className="textarea"
            rows={1}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              // Enter adds, shift-enter keeps typing a multi-line paste.
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                add();
              }
            }}
            placeholder="Add an item, or paste a few lines at once"
            style={{ minHeight: 44 }}
          />
          <button type="button" className="btn btn-primary" onClick={add} disabled={!draft.trim()}>
            <Plus />
            Add
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">
          <h2>The list is empty</h2>
          <p>
            Add items above, or open a recipe and use &ldquo;Add ingredients to list&rdquo;. The
            weekly menu can send everything for the week over at once.
          </p>
        </div>
      ) : (
        <div className="card" style={{ padding: "6px 16px" }}>
          <ul className="shopping-list">{open.map(row)}</ul>
          {done.length > 0 && (
            <>
              <div className="list-divider">In the cart</div>
              <ul className="shopping-list">{done.map(row)}</ul>
            </>
          )}
        </div>
      )}

      <div style={{ height: 50 }} />
    </>
  );
}

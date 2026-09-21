"use client";

import { useState } from "react";
import { Cart } from "./Icons";

export default function AddIngredientsButton({ recipeId, count }: { recipeId: string; count: number }) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  async function add() {
    setBusy(true);
    setStatus("");
    try {
      const res = await fetch("/api/shopping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeIds: [recipeId] }),
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { added: number; skipped: number };
      setStatus(
        data.added === 0
          ? "Already on the list."
          : `Added ${data.added}${data.skipped ? `, skipped ${data.skipped}` : ""}.`
      );
    } catch {
      setStatus("Couldn't reach the list.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button type="button" className="btn" style={{ width: "100%", marginTop: 10 }} onClick={add} disabled={busy}>
        <Cart />
        {busy ? "Adding…" : `Add ${count} ingredient${count === 1 ? "" : "s"} to list`}
      </button>
      {status && (
        <p className="field-hint" style={{ textAlign: "center", marginTop: 7 }}>
          {status}
        </p>
      )}
    </>
  );
}

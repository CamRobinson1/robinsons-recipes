"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChefHat } from "@/components/Icons";

export default function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");

    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.replace(next);
      router.refresh();
      return;
    }

    const data = (await res.json().catch(() => ({}))) as { error?: string };
    setError(data.error ?? "Something went wrong.");
    setBusy(false);
  }

  return (
    <div className="login-shell">
      <form className="login-card" onSubmit={submit}>
        <div className="login-mark">
          <ChefHat size={30} />
        </div>
        <h1 style={{ fontSize: 26, letterSpacing: "-0.025em" }}>Robinson&rsquo;s Recipes</h1>
        <p style={{ color: "var(--muted)", fontSize: 14.5, margin: "6px 0 22px" }}>
          The kitchen is locked. What&rsquo;s the word?
        </p>

        <input
          className="input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoFocus
          autoComplete="current-password"
          style={{ textAlign: "center" }}
        />

        {error && (
          <p className="error-text" style={{ margin: "12px 0 0", textAlign: "center" }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          className="btn btn-primary btn-lg"
          disabled={busy || !password}
          style={{ width: "100%", marginTop: 16 }}
        >
          {busy ? "Checking…" : "Come in"}
        </button>
      </form>
    </div>
  );
}

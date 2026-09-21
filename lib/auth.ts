export const AUTH_COOKIE = "rr_auth";

/**
 * The cookie stores a hash of the shared password rather than the password
 * itself, so a glance at devtools doesn't hand it over. Web Crypto works in
 * both the edge middleware and node route handlers.
 */
export async function passwordToken(password: string): Promise<string> {
  const bytes = new TextEncoder().encode(`robinsons-recipes:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function sitePassword(): string | undefined {
  const value = process.env.RECIPES_PASSWORD?.trim();
  return value ? value : undefined;
}

/** No password configured means the gate is open, and the UI warns about it. */
export function gateEnabled(): boolean {
  return !!sitePassword();
}

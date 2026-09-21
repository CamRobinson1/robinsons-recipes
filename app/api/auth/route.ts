import { NextResponse } from "next/server";
import { AUTH_COOKIE, passwordToken, sitePassword } from "@/lib/auth";

export async function POST(request: Request) {
  const password = sitePassword();
  if (!password) {
    // Nothing to unlock, the gate is off.
    return NextResponse.json({ ok: true });
  }

  let submitted = "";
  try {
    submitted = ((await request.json()) as { password?: string }).password ?? "";
  } catch {
    submitted = "";
  }

  if (submitted !== password) {
    return NextResponse.json({ error: "That's not it. Try again." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(AUTH_COOKIE, await passwordToken(password), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(AUTH_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}

import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE, passwordToken, sitePassword } from "./lib/auth";

export async function middleware(request: NextRequest) {
  const password = sitePassword();
  // No password set: the site is open and the header warns about it.
  if (!password) return NextResponse.next();

  const expected = await passwordToken(password);
  if (request.cookies.get(AUTH_COOKIE)?.value === expected) return NextResponse.next();

  // API calls get a clean 401 instead of an HTML redirect.
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const login = new URL("/login", request.url);
  if (request.nextUrl.pathname !== "/") {
    login.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
  }
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/((?!login|api/auth|uploads|_next/static|_next/image|favicon.ico|icon.svg|apple-icon.png).*)"],
};

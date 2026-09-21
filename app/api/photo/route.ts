import { NextResponse } from "next/server";
import { readPhoto } from "@/lib/store";

export const dynamic = "force-dynamic";

/**
 * Streams a private photo blob back to the browser.
 *
 * The middleware has already checked the password on every /api/ path, so
 * reaching this handler means the request is signed in. readPhoto only serves
 * pathnames under photos/, so this can't be pointed at the recipe JSON.
 */
export async function GET(request: Request) {
  const pathname = new URL(request.url).searchParams.get("p");
  if (!pathname) return new NextResponse("Missing photo", { status: 400 });

  const result = await readPhoto(pathname);
  if (!result || result.statusCode !== 200) {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(result.stream, {
    headers: {
      "Content-Type": result.blob.contentType ?? "image/jpeg",
      "X-Content-Type-Options": "nosniff",
      // Blob pathnames carry a random suffix and are never reused, so the
      // bytes behind a URL never change. Private keeps it out of shared caches.
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}

import { NextResponse } from "next/server";
import { savePhoto } from "@/lib/store";

export const dynamic = "force-dynamic";

// Photos are downscaled in the browser before they get here (see PhotoUploader),
// so these stay comfortably under the request body limit even straight off a phone.
const MAX_BYTES = 4 * 1024 * 1024;

const TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No image received." }, { status: 400 });
  }

  const extension = TYPES[file.type];
  if (!extension) {
    return NextResponse.json({ error: "That file type isn't an image we can store." }, { status: 415 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "That photo is too large even after resizing." }, { status: 413 });
  }

  const photo = await savePhoto(await file.arrayBuffer(), file.type, extension);
  return NextResponse.json({ photo });
}

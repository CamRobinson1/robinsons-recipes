import { NextResponse } from "next/server";
import { deletePhoto, deleteRecipe, getRecipe, saveRecipe } from "@/lib/store";
import { normalizeRecipe } from "@/lib/validate";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  const recipe = await getRecipe((await params).id);
  if (!recipe) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ recipe });
}

export async function PUT(request: Request, { params }: Ctx) {
  const existing = await getRecipe((await params).id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const result = normalizeRecipe(await request.json().catch(() => ({})), existing);
  if ("error" in result) return NextResponse.json(result, { status: 400 });

  await saveRecipe(result);

  // Photos dropped during the edit are no longer referenced anywhere.
  const kept = new Set(result.photos.map((p) => p.pathname));
  for (const photo of existing.photos) {
    if (!kept.has(photo.pathname)) await deletePhoto(photo.pathname).catch(() => {});
  }

  return NextResponse.json({ recipe: result });
}

export async function DELETE(_request: Request, { params }: Ctx) {
  await deleteRecipe((await params).id);
  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { listRecipes, saveRecipe } from "@/lib/store";
import { normalizeRecipe } from "@/lib/validate";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ recipes: await listRecipes() });
}

export async function POST(request: Request) {
  const result = normalizeRecipe(await request.json().catch(() => ({})));
  if ("error" in result) return NextResponse.json(result, { status: 400 });
  await saveRecipe(result);
  return NextResponse.json({ recipe: result }, { status: 201 });
}

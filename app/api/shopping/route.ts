import { NextResponse } from "next/server";
import { getRecipe, getShoppingList, saveShoppingList } from "@/lib/store";
import type { ShoppingItem } from "@/lib/types";

export const dynamic = "force-dynamic";

const MAX_ITEMS = 300;

function cleanItems(raw: unknown): ShoppingItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is Partial<ShoppingItem> => !!item && typeof item === "object")
    .map((item) => ({
      id: typeof item.id === "string" && item.id ? item.id.slice(0, 64) : crypto.randomUUID(),
      text: typeof item.text === "string" ? item.text.trim().slice(0, 200) : "",
      checked: item.checked === true,
      source: typeof item.source === "string" ? item.source.trim().slice(0, 160) : "",
    }))
    .filter((item) => item.text)
    .slice(0, MAX_ITEMS);
}

/** Same ingredient from two recipes shouldn't show up twice. */
function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

export async function GET() {
  return NextResponse.json({ list: await getShoppingList() });
}

/** Replaces the whole list. Used for ticking items off, editing and clearing. */
export async function PUT(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { items?: unknown };
  const list = { items: cleanItems(body.items), updatedAt: Date.now() };
  await saveShoppingList(list);
  return NextResponse.json({ list });
}

/** Pulls the ingredients out of the named recipes, tagged with where they came from. */
async function itemsFromRecipes(raw: unknown): Promise<ShoppingItem[]> {
  if (!Array.isArray(raw)) return [];
  const ids = raw.filter((id): id is string => typeof id === "string").slice(0, 30);

  const recipes = await Promise.all(ids.map((id) => getRecipe(id)));
  return recipes.flatMap((recipe) =>
    recipe
      ? recipe.ingredients.map((text) => ({
          id: crypto.randomUUID(),
          text,
          checked: false,
          source: recipe.title,
        }))
      : []
  );
}

/**
 * Appends items, skipping ones already on the list. Read-then-write on the
 * server so two phones adding at once don't wipe each other's additions.
 * Takes either raw `items` or `recipeIds` to pull ingredients from.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { items?: unknown; recipeIds?: unknown };
  const incoming = [...cleanItems(body.items), ...(await itemsFromRecipes(body.recipeIds))];

  const current = await getShoppingList();
  const seen = new Set(current.items.map((item) => normalize(item.text)));

  const added: ShoppingItem[] = [];
  for (const item of incoming) {
    const key = normalize(item.text);
    if (seen.has(key)) continue;
    seen.add(key);
    added.push(item);
  }

  const list = {
    items: [...current.items, ...added].slice(0, MAX_ITEMS),
    updatedAt: Date.now(),
  };
  await saveShoppingList(list);

  return NextResponse.json({ list, added: added.length, skipped: incoming.length - added.length });
}

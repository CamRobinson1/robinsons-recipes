import { del, list, put } from "@vercel/blob";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { Recipe, ShoppingList, WeekMenu } from "./types";

// Persistence for Robinson's Recipes.
//
// Production: Vercel Blob. One small private JSON file per recipe under
// recipes/, one per planned week under menus/, one shopping list, plus public
// image blobs under photos/ so <img> can load them.
//
// Local dev with no Blob token: the same shape on disk under .data/ and
// public/uploads/, so `npm run dev` works before storage is linked.

const RECIPE_PREFIX = "recipes/";
const PHOTO_PREFIX = "photos/";
const MENU_PREFIX = "menus/";
const LIST_PATH = "shopping/list.json";

// The token is normally BLOB_READ_WRITE_TOKEN, but the value can arrive messy
// (stray quotes, a newline, a whole .env snippet pasted in). A real token always
// looks like vercel_blob_rw_..., so pull exactly that substring out of whatever
// we were handed rather than 500ing on every request.
function extractBlobToken(raw?: string | null): string | undefined {
  if (!raw) return undefined;
  const match = raw.match(/vercel_blob_rw_[A-Za-z0-9_]+/);
  return match ? match[0] : undefined;
}

function resolveToken(): string | undefined {
  const direct = extractBlobToken(process.env.BLOB_READ_WRITE_TOKEN);
  if (direct) return direct;
  for (const value of Object.values(process.env)) {
    const found = extractBlobToken(value);
    if (found) return found;
  }
  return undefined;
}

const token = resolveToken();

/** True when recipes sync across devices. False means local-disk dev mode. */
export function storageReady(): boolean {
  return !!token;
}

const LOCAL_ROOT = path.join(process.cwd(), ".data");
const LOCAL_DATA = path.join(LOCAL_ROOT, "recipes");
const LOCAL_MENUS = path.join(LOCAL_ROOT, "menus");
const LOCAL_LIST = path.join(LOCAL_ROOT, "shopping.json");
const LOCAL_UPLOADS = path.join(process.cwd(), "public", "uploads");

function recipePath(id: string) {
  return `${RECIPE_PREFIX}${id}.json`;
}

// Private blobs aren't publicly fetchable, so the URL needs the token.
function authFetch(url: string) {
  return fetch(url, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function listRecipes(): Promise<Recipe[]> {
  let recipes: Recipe[];

  if (!token) {
    try {
      const files = await fs.readdir(LOCAL_DATA);
      const loaded = await Promise.all(
        files
          .filter((f) => f.endsWith(".json"))
          .map(async (f) => {
            try {
              return JSON.parse(await fs.readFile(path.join(LOCAL_DATA, f), "utf8")) as Recipe;
            } catch {
              return null;
            }
          })
      );
      recipes = loaded.filter((r): r is Recipe => r !== null);
    } catch {
      recipes = [];
    }
  } else {
    let blobs: Awaited<ReturnType<typeof list>>["blobs"];
    try {
      ({ blobs } = await list({ prefix: RECIPE_PREFIX, token }));
    } catch {
      return [];
    }
    const loaded = await Promise.all(
      blobs.map(async (b) => {
        try {
          const res = await authFetch(b.url);
          if (!res.ok) return null;
          return (await res.json()) as Recipe;
        } catch {
          return null;
        }
      })
    );
    recipes = loaded.filter((r): r is Recipe => r !== null);
  }

  // Newest cook first, which is what you want when you open the site.
  return recipes.sort((a, b) => (b.madeOn || "").localeCompare(a.madeOn || "") || b.createdAt - a.createdAt);
}

export async function getRecipe(id: string): Promise<Recipe | null> {
  if (!token) {
    try {
      return JSON.parse(await fs.readFile(path.join(LOCAL_DATA, `${id}.json`), "utf8")) as Recipe;
    } catch {
      return null;
    }
  }
  try {
    const { blobs } = await list({ prefix: recipePath(id), token });
    const blob = blobs.find((b) => b.pathname === recipePath(id));
    if (!blob) return null;
    const res = await authFetch(blob.url);
    if (!res.ok) return null;
    return (await res.json()) as Recipe;
  } catch {
    return null;
  }
}

export async function saveRecipe(recipe: Recipe): Promise<void> {
  const body = JSON.stringify(recipe, null, 2);
  if (!token) {
    await fs.mkdir(LOCAL_DATA, { recursive: true });
    await fs.writeFile(path.join(LOCAL_DATA, `${recipe.id}.json`), body, "utf8");
    return;
  }
  await put(recipePath(recipe.id), body, {
    access: "private",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 0,
    token,
  });
}

export async function deleteRecipe(id: string): Promise<void> {
  const recipe = await getRecipe(id);

  if (!token) {
    try {
      await fs.unlink(path.join(LOCAL_DATA, `${id}.json`));
    } catch {
      /* already gone */
    }
  } else {
    try {
      const { blobs } = await list({ prefix: recipePath(id), token });
      const blob = blobs.find((b) => b.pathname === recipePath(id));
      if (blob) await del(blob.url, { token });
    } catch {
      /* already gone */
    }
  }

  // Don't leave orphaned photos behind paying for storage.
  for (const photo of recipe?.photos ?? []) {
    await deletePhoto(photo.pathname).catch(() => {});
  }
}

/** Stores an already-downscaled image and returns its public URL. */
export async function savePhoto(
  data: ArrayBuffer,
  contentType: string,
  extension: string
): Promise<{ url: string; pathname: string }> {
  const name = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.${extension}`;

  if (!token) {
    await fs.mkdir(LOCAL_UPLOADS, { recursive: true });
    await fs.writeFile(path.join(LOCAL_UPLOADS, name), Buffer.from(data));
    return { url: `/uploads/${name}`, pathname: `local:${name}` };
  }

  const blob = await put(`${PHOTO_PREFIX}${name}`, Buffer.from(data), {
    access: "public",
    contentType,
    addRandomSuffix: true,
    token,
  });
  return { url: blob.url, pathname: blob.pathname };
}

// ---------------------------------------------------------------- menus & list

/** Reads one JSON blob (or local file) and hands back null when it isn't there. */
async function readJson<T>(blobPath: string, localPath: string): Promise<T | null> {
  if (!token) {
    try {
      return JSON.parse(await fs.readFile(localPath, "utf8")) as T;
    } catch {
      return null;
    }
  }
  try {
    const { blobs } = await list({ prefix: blobPath, token });
    const blob = blobs.find((b) => b.pathname === blobPath);
    if (!blob) return null;
    const res = await authFetch(blob.url);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function writeJson(blobPath: string, localPath: string, value: unknown): Promise<void> {
  const body = JSON.stringify(value, null, 2);
  if (!token) {
    await fs.mkdir(path.dirname(localPath), { recursive: true });
    await fs.writeFile(localPath, body, "utf8");
    return;
  }
  await put(blobPath, body, {
    access: "private",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 0,
    token,
  });
}

function menuPaths(weekStart: string) {
  return {
    blob: `${MENU_PREFIX}${weekStart}.json`,
    local: path.join(LOCAL_MENUS, `${weekStart}.json`),
  };
}

/** An unplanned week reads as an empty one rather than a 404. */
export async function getMenu(weekStart: string): Promise<WeekMenu> {
  const { blob, local } = menuPaths(weekStart);
  const stored = await readJson<WeekMenu>(blob, local);
  return stored ?? { weekStart, entries: {}, updatedAt: 0 };
}

export async function saveMenu(menu: WeekMenu): Promise<void> {
  const { blob, local } = menuPaths(menu.weekStart);
  await writeJson(blob, local, menu);
}

export async function getShoppingList(): Promise<ShoppingList> {
  const stored = await readJson<ShoppingList>(LIST_PATH, LOCAL_LIST);
  return stored ?? { items: [], updatedAt: 0 };
}

export async function saveShoppingList(shoppingList: ShoppingList): Promise<void> {
  await writeJson(LIST_PATH, LOCAL_LIST, shoppingList);
}

export async function deletePhoto(pathname: string): Promise<void> {
  if (pathname.startsWith("local:")) {
    await fs.unlink(path.join(LOCAL_UPLOADS, pathname.slice("local:".length))).catch(() => {});
    return;
  }
  if (!token) return;
  try {
    const { blobs } = await list({ prefix: pathname, token });
    const blob = blobs.find((b) => b.pathname === pathname);
    if (blob) await del(blob.url, { token });
  } catch {
    /* ignore */
  }
}

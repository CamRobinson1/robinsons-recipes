# Robinson's Recipes

A private cookbook for everything Cam and Alexia cook at home. Photos straight off a
phone, a score out of 10, and enough detail to actually make the thing again.

Four sections:

- **Cookbook** (`/`) is the rated archive, with search, filters and stats.
- **This week** (`/menu`) is a Sunday-to-Saturday planner with breakfast, lunch and
  dinner for each day. A slot holds a recipe or a written-in plan like "leftovers".
- **Shopping** (`/list`) is a shared checklist. Items can be typed in, pulled from one
  recipe, or sent over from a whole planned week at once.
- **Surprise me** (`/pick`) picks a recipe at random from whatever fits your filters,
  and can drop it straight onto today's menu.

## Running it locally

```bash
npm install
npm run dev
```

With no environment variables set, the site is unlocked and recipes are written to
`.data/` and `public/uploads/` on your machine. Both are gitignored. That's fine for
poking at the UI, but nothing syncs between devices until Blob is linked.

## Environment

| Variable | What it does |
| --- | --- |
| `RECIPES_PASSWORD` | The shared password. Unset means the site is wide open and the home page says so. |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob store token. Unset means local-disk storage only. |

Copy `.env.example` to `.env.local` to set them locally.

## Deploying

Already set up. `main` is connected to the Vercel project `cam-robinson/robinsons-recipes`,
so pushing deploys:

```bash
git push
```

Pushes to `main` go to production at https://robinsons-recipes.vercel.app. Pushes to any
other branch get their own preview URL. To deploy without pushing, run
`npx vercel deploy --prod` from this directory.

Both env vars are set on all three environments. They are stored as Secrets on Production
and Preview, and as Config on Development. Development has to stay Config, because
`vercel env pull` can't read a Secret back, and without the token local dev silently falls
back to disk storage.

To point local dev at the real store, run `npx vercel env pull .env.local`.

### If you ever rebuild this from scratch

1. `vercel link` to create the project.
2. `vercel blob create-store <name> --access private --yes` to create and connect storage.
   That sets `BLOB_READ_WRITE_TOKEN` on every environment.
3. Add `RECIPES_PASSWORD` in Settings → Environment Variables.
4. Deploy. Changing an env var needs a redeploy before it takes effect.

## How it's put together

- **Storage** (`lib/store.ts`): one private JSON blob per recipe under `recipes/`, one
  per planned week under `menus/`, one shopping list at `shopping/list.json`, and public
  image blobs under `photos/`. No database. Falls back to the local filesystem when
  there's no Blob token so `npm run dev` works out of the box.
- **Auth** (`middleware.ts`, `lib/auth.ts`): one shared password. The cookie holds a
  SHA-256 of it, not the password. Middleware redirects pages to `/login` and returns
  401 for `/api/*`.
- **Photos** (`components/PhotoUploader.tsx`): resized in the browser to 1600px on the
  long edge before upload, so a 4MB phone shot becomes ~300KB. EXIF rotation is honoured
  so portrait photos don't land sideways.
- **Validation** (`lib/validate.ts`): everything except the name is optional. Unknown or
  malformed fields are dropped rather than rejected, so one bad field never costs you the
  recipe you just typed out.
- **Weeks** (`lib/week.ts`): all dates are `yyyy-mm-dd` strings, and Date objects are
  always built from the parts. `new Date("2026-09-20")` parses as UTC midnight, which is
  the 19th in Pacific and would shift the whole week by a day.
- **Menu writes** (`app/api/menu/route.ts`): the week is snapped to its Sunday on every
  request, so one week can never be stored under two keys. Slots outside that week are
  dropped.
- **List writes** (`app/api/shopping/route.ts`): `PUT` replaces the list for checking
  things off, `POST` appends and dedupes with a read-then-write on the server, so two
  phones adding at once don't wipe each other.

### A note on two people editing at once

The menu and the shopping list save the whole document. If you and Alexia edit the same
week in the same few seconds, the later save wins. Adding to the shopping list is the
exception and merges properly. For two people in one kitchen this is fine; it would need
per-field writes to be truly safe.

## Ideas not built yet

- Import a recipe by pasting a URL
- Export everything, so a Blob outage can't lose the book
- Roll a planned week forward to the next one in a click

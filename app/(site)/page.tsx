import RecipeBrowser from "@/components/RecipeBrowser";
import { gateEnabled } from "@/lib/auth";
import { listRecipes, storageReady } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const recipes = await listRecipes();

  return (
    <div className="wrap">
      {!storageReady() && (
        <p className="banner">
          Storage isn&rsquo;t linked yet, so recipes are only saved on this machine. Add{" "}
          <code>BLOB_READ_WRITE_TOKEN</code> to sync across your phones.
        </p>
      )}
      {!gateEnabled() && (
        <p className="banner">
          This site is open to anyone with the link. Set <code>RECIPES_PASSWORD</code> to lock it.
        </p>
      )}
      <RecipeBrowser recipes={recipes} />
    </div>
  );
}

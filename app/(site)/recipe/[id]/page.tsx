import Link from "next/link";
import { notFound } from "next/navigation";
import AddIngredientsButton from "@/components/AddIngredientsButton";
import PhotoGallery from "@/components/PhotoGallery";
import { ArrowLeft, Flame, Link as LinkIcon, Pencil, Repeat } from "@/components/Icons";
import { DIFFICULTY_LABELS } from "@/lib/constants";
import { costPerServing, formatDate, formatMinutes, formatMoney, formatRating } from "@/lib/format";
import { getRecipe } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const recipe = await getRecipe((await params).id);
  return { title: recipe ? `${recipe.title} · Robinson's Recipes` : "Robinson's Recipes" };
}

export default async function RecipePage({ params }: { params: Promise<{ id: string }> }) {
  const recipe = await getRecipe((await params).id);
  if (!recipe) notFound();

  const specs: { key: string; value: string }[] = [];
  if (recipe.difficulty !== null) specs.push({ key: "Difficulty", value: DIFFICULTY_LABELS[recipe.difficulty] });
  if (recipe.servings) specs.push({ key: "Made", value: `${recipe.servings} ${recipe.servings === 1 ? "meal" : "meals"}` });
  if (recipe.activeMinutes !== null) specs.push({ key: "Hands-on", value: formatMinutes(recipe.activeMinutes) });
  if (recipe.totalMinutes !== null) specs.push({ key: "Total time", value: formatMinutes(recipe.totalMinutes) });
  if (recipe.cost !== null) {
    const per = costPerServing(recipe.cost, recipe.servings);
    specs.push({ key: "Cost", value: per ? `${formatMoney(recipe.cost)} · ${per}` : formatMoney(recipe.cost) });
  }
  if (recipe.cuisine) specs.push({ key: "Cuisine", value: recipe.cuisine });
  if (recipe.protein) specs.push({ key: "Protein", value: recipe.protein });
  if (recipe.madeOn) specs.push({ key: "Made on", value: formatDate(recipe.madeOn) });

  return (
    <div className="wrap">
      <Link href="/" className="back-link">
        <ArrowLeft />
        Back to cookbook
      </Link>

      <div className="page-head">
        <div style={{ minWidth: 0 }}>
          <h1 className="page-title">{recipe.title}</h1>
          <p className="page-sub">
            {recipe.sourceName || "Added to the cookbook"}
            {recipe.madeOn && ` · last made ${formatDate(recipe.madeOn)}`}
          </p>
        </div>
        <Link href={`/recipe/${recipe.id}/edit`} className="btn">
          <Pencil />
          Edit
        </Link>
      </div>

      <div className="detail-layout">
        <div>
          <PhotoGallery photos={recipe.photos} title={recipe.title} />

          {(recipe.methods.length > 0 || recipe.tags.length > 0 || recipe.wouldMakeAgain !== null) && (
            <div className="chip-row" style={{ marginTop: 16 }}>
              {recipe.methods.map((m) => (
                <span key={m} className="chip chip-method">
                  <Flame size={12} />
                  {m}
                </span>
              ))}
              {recipe.tags.map((t) => (
                <span key={t} className="chip chip-tag">
                  {t}
                </span>
              ))}
              {recipe.wouldMakeAgain !== null && (
                <span className="chip chip-outline">
                  <Repeat />
                  {recipe.wouldMakeAgain ? "Would make again" : "Not again"}
                </span>
              )}
            </div>
          )}

          {recipe.notes && (
            <div style={{ marginTop: 22 }}>
              <h2 className="section-title">Notes for next time</h2>
              <div className="note-block">{recipe.notes}</div>
            </div>
          )}

          {recipe.ingredients.length > 0 && (
            <div style={{ marginTop: 26 }}>
              <h2 className="section-title">Ingredients</h2>
              <ul className="ingredient-list">
                {recipe.ingredients.map((item, i) => (
                  <li key={`${item}-${i}`}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {recipe.steps.length > 0 && (
            <div style={{ marginTop: 26 }}>
              <h2 className="section-title">Steps</h2>
              <ol className="step-list">
                {recipe.steps.map((step, i) => (
                  <li key={`${step}-${i}`}>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        <aside className="card" style={{ padding: "18px 20px", position: "sticky", top: 86 }}>
          {recipe.rating !== null ? (
            <div className="big-score">
              <b>{formatRating(recipe.rating)}</b>
              <span>/ 10</span>
            </div>
          ) : (
            <div className="big-score">
              <span>Not scored yet</span>
            </div>
          )}

          <div className="spec-list" style={{ marginTop: 14 }}>
            {specs.map((spec) => (
              <div key={spec.key} className="spec">
                <span className="spec-key">{spec.key}</span>
                <span className="spec-val">{spec.value}</span>
              </div>
            ))}
          </div>

          {recipe.sourceUrl && (
            <a
              href={recipe.sourceUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="btn"
              style={{ width: "100%", marginTop: 14 }}
            >
              <LinkIcon />
              Open the original
            </a>
          )}

          {recipe.ingredients.length > 0 && (
            <AddIngredientsButton recipeId={recipe.id} count={recipe.ingredients.length} />
          )}
        </aside>
      </div>

      <div style={{ height: 50 }} />
    </div>
  );
}

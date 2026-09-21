import Link from "next/link";
import { Bowl, Camera, Clock, Flame, Repeat } from "./Icons";
import { formatMinutes, formatRating } from "@/lib/format";
import type { Recipe } from "@/lib/types";

export default function RecipeCard({ recipe }: { recipe: Recipe }) {
  const cover = recipe.photos[0];
  const time = formatMinutes(recipe.totalMinutes ?? recipe.activeMinutes);

  return (
    <Link href={`/recipe/${recipe.id}`} className="recipe-card">
      <div className="recipe-photo">
        {cover ? (
          // Plain <img>: photos are already downscaled at upload time, and this
          // keeps Blob URLs working without remote-pattern config.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover.url} alt="" loading="lazy" />
        ) : (
          <div className="recipe-photo-empty">
            <Bowl size={44} />
          </div>
        )}

        {recipe.rating !== null && (
          <div className="score-badge">
            {formatRating(recipe.rating)}
            <small>/10</small>
          </div>
        )}

        {recipe.wouldMakeAgain === true && (
          <div className="repeat-flag">
            <Repeat />
            Again
          </div>
        )}

        {recipe.photos.length > 1 && (
          <div className="photo-count">
            <Camera size={12} />
            {recipe.photos.length}
          </div>
        )}
      </div>

      <div className="recipe-body">
        <h3 className="recipe-title">{recipe.title}</h3>

        {recipe.methods.length > 0 && (
          <div className="chip-row">
            {recipe.methods.slice(0, 2).map((m) => (
              <span key={m} className="chip chip-method">
                <Flame size={12} />
                {m}
              </span>
            ))}
            {recipe.methods.length > 2 && <span className="chip chip-outline">+{recipe.methods.length - 2}</span>}
          </div>
        )}

        <div className="recipe-meta">
          {time && (
            <span>
              <Clock />
              {time}
            </span>
          )}
          {recipe.servings ? (
            <span>
              <Bowl />
              {recipe.servings} {recipe.servings === 1 ? "meal" : "meals"}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

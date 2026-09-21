import PickerBoard from "@/components/PickerBoard";
import { listRecipes } from "@/lib/store";

export const dynamic = "force-dynamic";

export const metadata = { title: "Surprise me · Robinson's Recipes" };

export default async function PickPage() {
  const recipes = await listRecipes();

  const candidates = recipes.map((recipe) => ({
    id: recipe.id,
    title: recipe.title,
    rating: recipe.rating,
    difficulty: recipe.difficulty,
    totalMinutes: recipe.totalMinutes,
    servings: recipe.servings,
    methods: recipe.methods,
    tags: recipe.tags,
    wouldMakeAgain: recipe.wouldMakeAgain,
    photo: recipe.photos[0]?.url ?? "",
  }));

  return (
    <div className="wrap" style={{ maxWidth: 780 }}>
      <PickerBoard recipes={candidates} />
    </div>
  );
}

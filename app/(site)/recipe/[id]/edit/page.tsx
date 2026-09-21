import { notFound } from "next/navigation";
import RecipeForm from "@/components/RecipeForm";
import { getRecipe } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function EditRecipePage({ params }: { params: Promise<{ id: string }> }) {
  const recipe = await getRecipe((await params).id);
  if (!recipe) notFound();

  return (
    <div className="wrap" style={{ maxWidth: 760 }}>
      <RecipeForm recipe={recipe} />
    </div>
  );
}

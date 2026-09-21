import RecipeForm from "@/components/RecipeForm";

export const metadata = { title: "New recipe · Robinson's Recipes" };

export default function NewRecipePage() {
  return (
    <div className="wrap" style={{ maxWidth: 760 }}>
      <RecipeForm />
    </div>
  );
}

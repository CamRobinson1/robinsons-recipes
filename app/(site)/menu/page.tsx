import MenuBoard from "@/components/MenuBoard";
import { getMenu, listRecipes } from "@/lib/store";
import { isIsoDate, startOfWeek } from "@/lib/week";

export const dynamic = "force-dynamic";

export const metadata = { title: "This week · Robinson's Recipes" };

export default async function MenuPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const requested = (await searchParams).week;
  const weekStart = startOfWeek(isIsoDate(requested) ? requested : "");

  const [menu, recipes] = await Promise.all([getMenu(weekStart), listRecipes()]);

  // The board only needs enough to search and label. Photos and steps stay on the server.
  const options = recipes.map((recipe) => ({
    id: recipe.id,
    title: recipe.title,
    rating: recipe.rating,
    totalMinutes: recipe.totalMinutes,
  }));

  return (
    <div className="wrap">
      <MenuBoard key={weekStart} weekStart={weekStart} initialEntries={menu.entries} recipes={options} />
    </div>
  );
}

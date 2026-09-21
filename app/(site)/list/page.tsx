import ShoppingBoard from "@/components/ShoppingBoard";
import { getShoppingList } from "@/lib/store";

export const dynamic = "force-dynamic";

export const metadata = { title: "Shopping list · Robinson's Recipes" };

export default async function ShoppingPage() {
  const list = await getShoppingList();

  return (
    <div className="wrap" style={{ maxWidth: 720 }}>
      <ShoppingBoard initialItems={list.items} />
    </div>
  );
}

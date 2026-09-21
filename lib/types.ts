export type Photo = {
  url: string;
  pathname: string;
};

export type Recipe = {
  id: string;
  title: string;
  /** Overall score out of 10. Half points allowed. */
  rating: number | null;
  /** 1 = dead easy, 5 = a whole project. */
  difficulty: number | null;
  /** How many meals it actually made, not what the recipe claimed. */
  servings: number | null;
  /** Stove top, oven, crock pot, grill, air fryer... a recipe can use several. */
  methods: string[];
  activeMinutes: number | null;
  totalMinutes: number | null;
  /** Rough dollars for the whole batch. Per-serving is derived. */
  cost: number | null;
  cuisine: string;
  protein: string;
  tags: string[];
  wouldMakeAgain: boolean | null;
  sourceName: string;
  sourceUrl: string;
  ingredients: string[];
  steps: string[];
  notes: string;
  photos: Photo[];
  /** ISO date (yyyy-mm-dd) of when it was made. */
  madeOn: string;
  createdAt: number;
  updatedAt: number;
};

export type RecipeInput = Omit<Recipe, "id" | "createdAt" | "updatedAt">;

export function emptyRecipe(): RecipeInput {
  return {
    title: "",
    rating: null,
    difficulty: null,
    servings: null,
    methods: [],
    activeMinutes: null,
    totalMinutes: null,
    cost: null,
    cuisine: "",
    protein: "",
    tags: [],
    wouldMakeAgain: null,
    sourceName: "",
    sourceUrl: "",
    ingredients: [],
    steps: [],
    notes: "",
    photos: [],
    madeOn: todayLocal(),
  };
}

/** Local yyyy-mm-dd. toISOString() would hand back tomorrow's date after 5pm Pacific. */
export function todayLocal(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export type ShoppingItem = {
  id: string;
  text: string;
  checked: boolean;
  /** Recipe title this came from, or "" when it was typed in by hand. */
  source: string;
};

export type ShoppingList = {
  items: ShoppingItem[];
  updatedAt: number;
};

export const MEAL_SLOTS = ["breakfast", "lunch", "dinner"] as const;
export type MealSlot = (typeof MEAL_SLOTS)[number];

export const MEAL_LABELS: Record<MealSlot, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
};

export type MenuEntry = {
  /** Empty for a free-text plan like "leftovers" or "out for pizza". */
  recipeId: string;
  /** Stored at assign time so the menu still reads right if the recipe is deleted. */
  title: string;
};

export type WeekMenu = {
  /** Sunday of the week, yyyy-mm-dd. */
  weekStart: string;
  /** Keyed `${yyyy-mm-dd}_${slot}`. */
  entries: Record<string, MenuEntry>;
  updatedAt: number;
};

export function slotKey(date: string, slot: MealSlot): string {
  return `${date}_${slot}`;
}

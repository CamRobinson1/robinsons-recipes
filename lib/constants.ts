export const METHODS = [
  "Stove top",
  "Oven",
  "Crock pot",
  "Grill",
  "Air fryer",
  "Instant pot",
  "Smoker",
  "Sous vide",
  "Microwave",
  "No cook",
] as const;

export const CUISINES = [
  "American",
  "Italian",
  "Mexican",
  "Chinese",
  "Japanese",
  "Thai",
  "Indian",
  "Mediterranean",
  "French",
  "Korean",
  "Greek",
  "Cajun",
  "BBQ",
  "Other",
];

export const PROTEINS = [
  "Chicken",
  "Beef",
  "Pork",
  "Turkey",
  "Fish",
  "Shrimp",
  "Eggs",
  "Beans",
  "Tofu",
  "Vegetarian",
  "None",
];

export const TAGS = [
  "Weeknight",
  "Date night",
  "Great leftovers",
  "Freezer friendly",
  "One pan",
  "Meal prep",
  "Company worthy",
  "Comfort food",
  "Healthy",
  "Cheap eats",
  "Holiday",
  "Breakfast",
  "Dessert",
  "Side dish",
  "Soup",
  "Snack",
];

export const DIFFICULTY_LABELS: Record<number, string> = {
  1: "Dead easy",
  2: "Easy",
  3: "Some work",
  4: "Involved",
  5: "A whole project",
};

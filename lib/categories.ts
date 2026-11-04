// The fixed list of categories the agent is allowed to choose from.
// Order = the order you'd usually walk through a supermarket, so it doubles as the "aisle" number.

export type Category = {
  name: string;
  emoji: string;
  color: string; // sign color for the aisle marker
};

export const CATEGORIES: Category[] = [
  { name: "Produce", emoji: "🥦", color: "#3F8F4F" },
  { name: "Bakery", emoji: "🍞", color: "#B7812C" },
  { name: "Dairy", emoji: "🥛", color: "#3C7DBF" },
  { name: "Meat & Fish", emoji: "🥩", color: "#B4474B" },
  { name: "Pantry", emoji: "🥫", color: "#A0692E" },
  { name: "Snacks", emoji: "🍪", color: "#D0662A" },
  { name: "Drinks", emoji: "🧃", color: "#1E8A86" },
  { name: "Frozen", emoji: "🧊", color: "#4F8DB0" },
  { name: "Household", emoji: "🧽", color: "#6E62A8" },
  { name: "Personal Care", emoji: "🧴", color: "#B0558A" },
  { name: "Other", emoji: "🛒", color: "#6B746F" },
];

export const CATEGORY_NAMES = CATEGORIES.map((c) => c.name);

export const FALLBACK_CATEGORY = "Other";

export function normalizeCategory(value: unknown): string {
  if (typeof value !== "string") return FALLBACK_CATEGORY;
  const match = CATEGORY_NAMES.find(
    (name) => name.toLowerCase() === value.trim().toLowerCase(),
  );
  return match ?? FALLBACK_CATEGORY;
}

export function getCategory(name: string): Category {
  return CATEGORIES.find((c) => c.name === name) ?? CATEGORIES[CATEGORIES.length - 1];
}

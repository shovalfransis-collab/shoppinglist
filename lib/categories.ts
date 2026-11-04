// The fixed list of categories the agent is allowed to choose from.
// Categories are stored by a stable `id`, never by display name, so switching language never
// breaks saved items. Order = the order you'd usually walk through a supermarket, so it doubles
// as the display order. "other" is the fallback and always stays last.

import type { Locale } from "./i18n/types";

export type Category = {
  id: string;
  emoji: string;
  color: string; // accent color for the category heading
  name: Record<Locale, string>;
};

export const CATEGORIES: Category[] = [
  { id: "fruits_veg", emoji: "🥦", color: "#3F8F4F", name: { en: "Fruits & Vegetables", he: "פירות וירקות" } },
  { id: "bakery", emoji: "🍞", color: "#B7812C", name: { en: "Bakery & Bread", he: "מאפייה ולחם" } },
  { id: "dairy_eggs", emoji: "🥛", color: "#3C7DBF", name: { en: "Dairy & Eggs", he: "מוצרי חלב וביצים" } },
  { id: "meat_chicken_fish", emoji: "🍗", color: "#B4474B", name: { en: "Meat, Chicken & Fish", he: "בשר, עוף ודגים" } },
  { id: "deli", emoji: "🥙", color: "#9A6B3F", name: { en: "Deli & Ready Meals", he: "מעדנייה ואוכל מוכן" } },
  { id: "pantry", emoji: "🍝", color: "#A0692E", name: { en: "Pantry & Dry Goods", he: "מוצרים יבשים ושימורים" } },
  { id: "spices_oils", emoji: "🧂", color: "#B5532F", name: { en: "Spices & Oils", he: "תבלינים ושמנים" } },
  { id: "sauces_spreads", emoji: "🫙", color: "#C08A1E", name: { en: "Sauces & Spreads", he: "רטבים וממרחים" } },
  { id: "snacks", emoji: "🍫", color: "#D0662A", name: { en: "Snacks & Sweets", he: "חטיפים ומתוקים" } },
  { id: "drinks", emoji: "🧃", color: "#1E8A86", name: { en: "Drinks", he: "משקאות" } },
  { id: "frozen", emoji: "🧊", color: "#4F8DB0", name: { en: "Frozen", he: "קפואים" } },
  { id: "cleaning", emoji: "🧽", color: "#6E62A8", name: { en: "Cleaning Products", he: "מוצרי ניקיון" } },
  { id: "personal_care", emoji: "🧴", color: "#B0558A", name: { en: "Personal Care", he: "טיפוח והיגיינה" } },
  { id: "household", emoji: "🧻", color: "#7A7F5A", name: { en: "Household & Paper", he: "בית ומוצרי נייר" } },
  { id: "other", emoji: "🛒", color: "#6B746F", name: { en: "Other", he: "אחר" } },
];

export const CATEGORY_IDS = CATEGORIES.map((c) => c.id);

export const FALLBACK_CATEGORY = "other";

// Ids that used to exist and were merged into others. Saved lists are upgraded with this on load.
const LEGACY_IDS: Record<string, string> = {
  spices_sauces: "spices_oils",
  breakfast: "sauces_spreads",
};

// Accepts only valid IDs; anything else (old names, typos, junk) becomes "other".
export function normalizeCategory(value: unknown): string {
  if (typeof value !== "string") return FALLBACK_CATEGORY;
  const id = LEGACY_IDS[value.trim()] ?? value.trim();
  return CATEGORY_IDS.includes(id) ? id : FALLBACK_CATEGORY;
}

export function getCategory(id: string): Category {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1];
}

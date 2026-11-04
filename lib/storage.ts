// Everything saved in the browser: several named lists, each with its items.
// Storage key history: v1 = one list, category names. v2 = one list, category ids.
// v3 (now) = many lists. Older keys are read once and migrated; they are never deleted.

import { FALLBACK_CATEGORY, normalizeCategory } from "./categories";

export type Item = {
  id: string;
  name: string;
  category: string | null; // null while the agent is still sorting it
  done: boolean;
  quantity: number; // 1 by default; changed by tapping the item
};

export type ShoppingListData = {
  id: string;
  name: string;
  items: Item[];
};

export const MIN_QUANTITY = 1;
export const MAX_QUANTITY = 99;
export const MAX_LIST_NAME = 40;

const KEY_V3 = "shoppinglist:v3";
const KEY_V2 = "shoppinglist:v2";
const KEY_V1 = "shoppinglist:v1";

// v1 saved the display names; later versions save stable ids. Anything unknown becomes "other".
const V1_NAME_TO_ID: Record<string, string> = {
  Produce: "fruits_veg",
  Bakery: "bakery",
  Dairy: "dairy_eggs",
  "Meat & Fish": "meat_chicken_fish",
  Pantry: "pantry",
  Snacks: "snacks",
  Drinks: "drinks",
  Frozen: "frozen",
  Household: "household",
  "Personal Care": "personal_care",
  Other: "other",
};

function cleanItems(raw: unknown): Item[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((i: Item) => ({
    ...i,
    // Anything that was mid-sort when the page closed lands in Other.
    category: normalizeCategory(i.category),
    quantity: typeof i.quantity === "number" && i.quantity >= MIN_QUANTITY ? i.quantity : 1,
  }));
}

// Reads the single-list formats (v2, or v1 converted on the fly).
function loadLegacyItems(): Item[] | null {
  const v2 = window.localStorage.getItem(KEY_V2);
  if (v2 !== null) return cleanItems(JSON.parse(v2));
  const v1 = window.localStorage.getItem(KEY_V1);
  if (v1 === null) return null;
  const old = JSON.parse(v1) as Item[];
  return cleanItems(
    old.map((i) => ({
      ...i,
      category: i.category === null ? null : (V1_NAME_TO_ID[i.category] ?? FALLBACK_CATEGORY),
    })),
  );
}

// `defaultName` names the list created when upgrading from a single-list save.
export function loadLists(defaultName: string): ShoppingListData[] {
  try {
    const raw = window.localStorage.getItem(KEY_V3);
    if (raw !== null) {
      const parsed = JSON.parse(raw) as { lists?: ShoppingListData[] };
      return (parsed.lists ?? []).map((l) => ({ ...l, items: cleanItems(l.items) }));
    }
    const legacy = loadLegacyItems();
    if (legacy !== null) {
      return [{ id: crypto.randomUUID(), name: defaultName, items: legacy }];
    }
  } catch {
    // Corrupt or unreadable save: start fresh rather than crash.
  }
  return [];
}

export function saveLists(lists: ShoppingListData[]) {
  try {
    window.localStorage.setItem(KEY_V3, JSON.stringify({ lists }));
  } catch {
    // Storage can be unavailable (private mode); the lists still work for this visit.
  }
}

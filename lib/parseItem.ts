// Turns what the user typed into { name, quantity }, and builds a key so the same item typed
// twice ("zucchini", "3 zucchinis") can be recognised and merged into one row.

import { MAX_QUANTITY, MIN_QUANTITY } from "./storage";

// "3 zucchini" is 3 of them, but "2 liters milk" or "500 g cheese" is a measurement, so we leave
// those alone. A short list is enough: anything not listed just keeps its number in the name.
const UNITS = new Set([
  "g", "gr", "gram", "grams", "kg", "kilo", "kilos", "mg", "ml", "l", "lt", "liter", "liters", "litre", "litres",
  "oz", "lb", "lbs", "cl", "dl", "cup", "cups", "tbsp", "tsp",
  "גרם", "גר׳", "קג", "ק״ג", "קילו", "מל", "מ״ל", "ליטר", "ל׳",
]);

export type ParsedItem = { name: string; quantity: number };

function clampQuantity(n: number): number | null {
  return Number.isInteger(n) && n >= MIN_QUANTITY && n <= MAX_QUANTITY ? n : null;
}

export function parseItem(input: string): ParsedItem {
  const text = input.trim().replace(/\s+/g, " ");

  // "3 zucchini", "3x zucchini", "3 × zucchini"
  const lead = text.match(/^(\d+)\s*[x×]?\s+(.+)$/i);
  if (lead) {
    const quantity = clampQuantity(Number(lead[1]));
    const firstWord = lead[2].split(" ")[0].toLowerCase();
    if (quantity !== null && !UNITS.has(firstWord)) return { name: lead[2], quantity };
  }

  // "zucchini x3", "zucchini × 3"
  const trail = text.match(/^(.+?)\s*[x×]\s*(\d+)$/i);
  if (trail) {
    const quantity = clampQuantity(Number(trail[2]));
    if (quantity !== null) return { name: trail[1], quantity };
  }

  return { name: text, quantity: 1 };
}

// Same key = same item. Ignores case and spacing, and a simple English plural ("zucchinis",
// "tomatoes", "berries"). Other languages (e.g. Hebrew) match on the exact word.
export function itemKey(name: string): string {
  const n = name.trim().toLowerCase().replace(/\s+/g, " ");
  if (!/^[a-z ]+$/.test(n) || n.length <= 3) return n;
  if (n.endsWith("ies")) return n.slice(0, -3) + "y";
  if (n.endsWith("oes")) return n.slice(0, -2);
  if (n.endsWith("s") && !n.endsWith("ss") && !n.endsWith("us")) return n.slice(0, -1);
  return n;
}

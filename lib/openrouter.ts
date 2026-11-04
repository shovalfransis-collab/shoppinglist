// Small server-side wrapper around OpenRouter's OpenAI-compatible chat API.
// Never import this from a client component: it reads the secret API key.

import { CATEGORIES, normalizeCategory } from "./categories";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "openai/gpt-4o-mini";

export class MissingApiKeyError extends Error {
  constructor() {
    super("OPENROUTER_API_KEY is not set");
  }
}

// One line per category: id, both names, and example items so the model has anchors.
const CATEGORY_HINTS: Record<string, string> = {
  fruits_veg: "tomatoes, bananas, onions, עגבניות",
  bakery: "bread, pita, challah, croissant",
  dairy_eggs: "milk, eggs, cheese, yogurt, butter",
  meat_chicken_fish: "chicken breast, salmon, tuna steak, minced beef",
  deli: "hummus, salads, olives, ready meals",
  pantry: "pasta, rice, flour, cereal, canned tuna, canned corn",
  spices_oils: "olive oil, vegetable oil, salt, pepper, cumin",
  sauces_spreads: "ketchup, mayo, tahini, jam, honey, chocolate spread",
  snacks: "Bamba, chips, chocolate, cookies",
  drinks: "water, juice, cola, coffee, beer",
  frozen: "ice cream, frozen peas, frozen pizza",
  cleaning: "dish soap, bleach, sponges, laundry detergent",
  personal_care: "shampoo, toothpaste, deodorant, diapers",
  household: "toilet paper, paper towels, batteries, trash bags",
  other: "only if nothing else fits",
};

const SYSTEM_PROMPT = `You sort grocery and household items into supermarket categories.
Reply with the category id. Allowed categories (id: English name / Hebrew name, examples):
${CATEGORIES.map((c) => `- ${c.id}: ${c.name.en} / ${c.name.he} (${CATEGORY_HINTS[c.id]})`).join("\n")}
Items can be in Hebrew or English, with typos or quantities ("2 חלב", "tomatos"). Sort by what the item is.
Reply with JSON only, in this shape: {"categories": ["<id for item 1>", "<id for item 2>", ...]}
Return exactly one id per item, in the same order as the input. Use only the ids above. If unsure, use "other".`;

export async function categorizeItems(items: string[]): Promise<string[]> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new MissingApiKeyError();

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "X-Title": "shoppinglist",
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || DEFAULT_MODEL,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: JSON.stringify({ items }) },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenRouter error ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  const content: string = data?.choices?.[0]?.message?.content ?? "{}";

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    parsed = {};
  }
  const list = (parsed as { categories?: unknown[] }).categories ?? [];

  // Always return one valid category per item, even if the model misbehaves.
  return items.map((_, i) => normalizeCategory(list[i]));
}

// Small server-side wrapper around OpenRouter's OpenAI-compatible chat API.
// Never import this from a client component: it reads the secret API key.

import { CATEGORY_NAMES, normalizeCategory } from "./categories";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "openai/gpt-4o-mini";

export class MissingApiKeyError extends Error {
  constructor() {
    super("OPENROUTER_API_KEY is not set");
  }
}

const SYSTEM_PROMPT = `You sort grocery and household items into supermarket categories.
Allowed categories (use the exact spelling): ${CATEGORY_NAMES.join(", ")}.
Items may be in any language, have typos, or include quantities ("2 milk"). Judge by what the item is.
Reply with JSON only, in this shape: {"categories": ["<category for item 1>", "<category for item 2>", ...]}
Return exactly one category per item, in the same order as the input. If unsure, use "Other".`;

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

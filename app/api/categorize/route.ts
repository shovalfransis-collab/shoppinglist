import { categorizeItems, MissingApiKeyError } from "@/lib/openrouter";

const MAX_ITEMS = 30;
const MAX_LENGTH = 80;

// POST /api/categorize  { items: ["milk", "bananas"] }  ->  { categories: ["dairy_eggs", "fruits_veg"] }
// Errors are { error: <code> } (bad_request | missing_key | agent_failed); the client translates them.
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }

  const raw = (body as { items?: unknown }).items;
  const items = Array.isArray(raw)
    ? raw
        .filter((v): v is string => typeof v === "string")
        .map((v) => v.trim().slice(0, MAX_LENGTH))
        .filter(Boolean)
        .slice(0, MAX_ITEMS)
    : [];

  if (items.length === 0) {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }

  try {
    const categories = await categorizeItems(items);
    return Response.json({ categories });
  } catch (err) {
    if (err instanceof MissingApiKeyError) {
      return Response.json(
        { error: "missing_key" },
        { status: 503 },
      );
    }
    console.error(err);
    return Response.json({ error: "agent_failed" }, { status: 502 });
  }
}

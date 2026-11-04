import { categorizeItems, MissingApiKeyError } from "@/lib/openrouter";

const MAX_ITEMS = 30;
const MAX_LENGTH = 80;

// POST /api/categorize  { items: ["milk", "bananas"] }  ->  { categories: ["Dairy", "Produce"] }
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Send JSON like { \"items\": [\"milk\"] }" }, { status: 400 });
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
    return Response.json({ error: "No items to sort" }, { status: 400 });
  }

  try {
    const categories = await categorizeItems(items);
    return Response.json({ categories });
  } catch (err) {
    if (err instanceof MissingApiKeyError) {
      return Response.json(
        { error: "The sorting agent isn't set up yet: add OPENROUTER_API_KEY to the environment." },
        { status: 503 },
      );
    }
    console.error(err);
    return Response.json({ error: "The sorting agent didn't answer. Items were put in Other." }, { status: 502 });
  }
}

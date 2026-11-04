"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CATEGORIES, FALLBACK_CATEGORY, normalizeCategory } from "@/lib/categories";

type Item = {
  id: string;
  name: string;
  category: string | null; // null while the agent is still sorting it
  done: boolean;
};

const STORAGE_KEY = "shoppinglist:v2";
const OLD_STORAGE_KEY = "shoppinglist:v1";

// v1 saved the display names; v2 saves stable ids. Anything unknown becomes "other".
const OLD_NAME_TO_ID: Record<string, string> = {
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

function loadItems(): Item[] {
  try {
    let raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      // One-time migration from v1: convert old names to ids, then save under the v2 key.
      const old = window.localStorage.getItem(OLD_STORAGE_KEY);
      if (old !== null) {
        const migrated = (JSON.parse(old) as Item[]).map((i) => ({
          ...i,
          category: i.category === null ? null : (OLD_NAME_TO_ID[i.category] ?? FALLBACK_CATEGORY),
        }));
        raw = JSON.stringify(migrated);
        window.localStorage.setItem(STORAGE_KEY, raw);
      }
    }
    const parsed = raw ? (JSON.parse(raw) as Item[]) : [];
    // Anything that was mid-sort when the page closed lands in Other.
    return parsed.map((i) => ({ ...i, category: normalizeCategory(i.category) }));
  } catch {
    return [];
  }
}

function saveItems(items: Item[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Storage can be unavailable (private mode); the list still works for this visit.
  }
}

// "milk, eggs\nbread" -> ["milk", "eggs", "bread"], so a whole list can be pasted at once.
function splitInput(text: string): string[] {
  return text
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function ShoppingList() {
  const [items, setItems] = useState<Item[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [draft, setDraft] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading localStorage must wait for the browser
    setItems(loadItems());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) saveItems(items);
  }, [items, loaded]);

  async function addItems(event: React.FormEvent) {
    event.preventDefault();
    const names = splitInput(draft);
    if (names.length === 0) return;

    const fresh: Item[] = names.map((name) => ({
      id: crypto.randomUUID(),
      name,
      category: null,
      done: false,
    }));
    setItems((prev) => [...fresh, ...prev]);
    setDraft("");
    inputRef.current?.focus();

    let categories: string[] = names.map(() => FALLBACK_CATEGORY);
    try {
      const res = await fetch("/api/categorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: names }),
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.categories)) {
        categories = data.categories;
        setNotice(null);
      } else {
        setNotice(data.error ?? "The sorting agent didn't answer. Items were put in Other.");
      }
    } catch {
      setNotice("You're offline. Items were put in Other.");
    }

    const byId = new Map(fresh.map((item, i) => [item.id, categories[i] ?? FALLBACK_CATEGORY]));
    setItems((prev) =>
      prev.map((item) => (byId.has(item.id) ? { ...item, category: byId.get(item.id)! } : item)),
    );
  }

  function toggle(id: string) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, done: !i.done } : i)));
  }

  function remove(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function clearChecked() {
    setItems((prev) => prev.filter((i) => !i.done));
  }

  const sorting = items.filter((i) => i.category === null);
  const aisles = useMemo(
    () =>
      CATEGORIES.map((category, index) => ({
        ...category,
        aisle: index + 1,
        items: items
          .filter((i) => i.category === category.id)
          .sort((a, b) => Number(a.done) - Number(b.done)),
      })).filter((a) => a.items.length > 0),
    [items],
  );

  const left = items.filter((i) => !i.done).length;
  const checked = items.length - left;

  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col px-4">
      <header className="pt-10 pb-6">
        <h1 className="font-display text-5xl leading-none font-extrabold tracking-tight">
          shoppinglist
        </h1>
        <div className="mt-3 flex items-baseline justify-between gap-4 text-muted">
          <p aria-live="polite">
            {items.length === 0
              ? "Sorted by aisle, automatically."
              : left === 0
                ? "Everything's in the cart."
                : `${left} left to get`}
          </p>
          {checked > 0 && (
            <button
              type="button"
              onClick={clearChecked}
              className="shrink-0 rounded-md px-2 py-1 text-sm font-bold text-ink underline decoration-line underline-offset-4 hover:decoration-ink"
            >
              Clear {checked} checked
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 pb-36">
        {loaded && items.length === 0 && (
          <p className="mt-10 max-w-sm text-lg text-muted">
            Your list is empty. Type what you need below, like{" "}
            <span className="text-ink">milk, eggs, bread</span>, and each item goes to its aisle.
          </p>
        )}

        {sorting.length > 0 && (
          <section aria-label="Sorting" className="mb-6">
            <ul className="space-y-1">
              {sorting.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center gap-3 rounded-lg border border-dashed border-line px-3 py-3 text-muted"
                >
                  <span className="size-2 animate-pulse rounded-full bg-go" aria-hidden />
                  <span className="text-ink">{item.name}</span>
                  <span className="ml-auto text-sm">finding its aisle…</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="space-y-7">
          {aisles.map((aisle) => (
            <section key={aisle.id} aria-labelledby={`aisle-${aisle.aisle}`}>
              <h2 id={`aisle-${aisle.aisle}`} className="mb-2 flex items-stretch gap-3">
                <span
                  className="font-display flex w-11 shrink-0 flex-col items-center justify-center rounded-md py-1 leading-none text-white"
                  style={{ backgroundColor: aisle.color }}
                >
                  <span className="text-[10px] font-semibold opacity-85">aisle</span>
                  <span className="text-xl font-extrabold">{aisle.aisle}</span>
                </span>
                <span className="flex flex-1 items-center justify-between border-b-2 pb-1" style={{ borderColor: aisle.color }}>
                  <span className="font-display text-2xl font-bold tracking-tight">
                    <span aria-hidden className="mr-2">
                      {aisle.emoji}
                    </span>
                    {aisle.name.en}
                  </span>
                  <span className="text-sm text-muted">{aisle.items.length}</span>
                </span>
              </h2>

              <ul>
                {aisle.items.map((item) => (
                  <li key={item.id} className="animate-land group flex items-center gap-1">
                    <label className="flex min-h-12 flex-1 cursor-pointer items-center gap-3 rounded-lg px-2 hover:bg-surface">
                      <input
                        type="checkbox"
                        checked={item.done}
                        onChange={() => toggle(item.id)}
                        className="size-5 shrink-0 cursor-pointer"
                        style={{ accentColor: aisle.color }}
                      />
                      <span
                        className={`text-lg transition-colors ${item.done ? "text-muted line-through decoration-2" : ""}`}
                      >
                        {item.name}
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={() => remove(item.id)}
                      aria-label={`Remove ${item.name}`}
                      className="grid size-10 place-items-center rounded-lg text-xl text-muted opacity-60 hover:bg-surface hover:text-ink hover:opacity-100 focus-visible:opacity-100"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 border-t border-line bg-ground/90 backdrop-blur">
        <form
          onSubmit={addItems}
          className="mx-auto flex max-w-xl flex-col gap-2 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
        >
          {notice && (
            <p role="status" className="text-sm text-muted">
              {notice}
            </p>
          )}
          <div className="flex gap-2">
            <label htmlFor="new-item" className="sr-only">
              Item to add
            </label>
            <input
              ref={inputRef}
              id="new-item"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="milk, eggs, bread…"
              autoComplete="off"
              enterKeyHint="done"
              className="min-h-12 min-w-0 flex-1 rounded-lg border border-line bg-surface px-4 text-lg placeholder:text-muted/70"
            />
            <button
              type="submit"
              disabled={!draft.trim()}
              className="min-h-12 shrink-0 rounded-lg bg-go px-5 font-bold text-go-ink disabled:opacity-40"
            >
              Add item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

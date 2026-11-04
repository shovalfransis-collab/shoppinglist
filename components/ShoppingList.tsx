"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CATEGORIES, FALLBACK_CATEGORY, normalizeCategory } from "@/lib/categories";
import { dictionaries, useLocale, useT, type ErrorCode, type Locale } from "@/lib/i18n";

type Item = {
  id: string;
  name: string;
  category: string | null; // null while the agent is still sorting it
  done: boolean;
  quantity: number; // 1 by default; changed by tapping the item
};

const MIN_QUANTITY = 1;
const MAX_QUANTITY = 99;

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
    return parsed.map((i) => ({
      ...i,
      category: normalizeCategory(i.category),
      quantity: typeof i.quantity === "number" && i.quantity >= MIN_QUANTITY ? i.quantity : 1, // older saves have none
    }));
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
  // Stored as a code (not text) so the message re-translates if the language is switched.
  const [notice, setNotice] = useState<ErrorCode | null>(null);
  const [openId, setOpenId] = useState<string | null>(null); // item whose quantity stepper is open
  const t = useT();
  const { locale, setLocale } = useLocale();
  const otherLocale: Locale = locale === "en" ? "he" : "en";
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
      quantity: 1,
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
        setNotice(data.error in t.errors ? data.error : "agent_failed");
      }
    } catch {
      setNotice("offline");
    }

    const byId = new Map(fresh.map((item, i) => [item.id, categories[i] ?? FALLBACK_CATEGORY]));
    setItems((prev) =>
      prev.map((item) => (byId.has(item.id) ? { ...item, category: byId.get(item.id)! } : item)),
    );
  }

  function toggle(id: string) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, done: !i.done } : i)));
  }

  function setQuantity(id: string, quantity: number) {
    const clamped = Math.min(MAX_QUANTITY, Math.max(MIN_QUANTITY, quantity));
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity: clamped } : i)));
  }

  function remove(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function clearChecked() {
    setItems((prev) => prev.filter((i) => !i.done));
  }

  const sorting = items.filter((i) => i.category === null);
  const groups = useMemo(
    () =>
      CATEGORIES.map((category) => ({
        ...category,
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
      <header className="pt-6 pb-6">
        <div className="flex items-start justify-between gap-4">
          <h1 className="font-display pt-4 text-5xl leading-none font-extrabold tracking-tight">
            {t.title}
          </h1>
          {/* Shows the OTHER language's own name, in that language, so it's always readable. */}
          <button
            type="button"
            onClick={() => setLocale(otherLocale)}
            lang={otherLocale}
            aria-label={t.switchLanguageLabel}
            className="shrink-0 rounded-lg border border-line bg-surface px-3 py-2 text-sm font-bold"
          >
            {dictionaries[otherLocale].languageName}
          </button>
        </div>
        <div className="mt-3 flex items-baseline justify-between gap-4 text-muted">
          <p aria-live="polite">
            {items.length === 0
              ? t.subtitle
              : left === 0
                ? t.allInCart
                : t.leftToGet(left)}
          </p>
          {checked > 0 && (
            <button
              type="button"
              onClick={clearChecked}
              className="shrink-0 rounded-md px-2 py-1 text-sm font-bold text-ink underline decoration-line underline-offset-4 hover:decoration-ink"
            >
              {t.clearChecked(checked)}
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 pb-36">
        {loaded && items.length === 0 && (
          <p className="mt-10 max-w-sm text-lg text-muted">
            {t.emptyIntro} <span className="text-ink">{t.emptyExample}</span>
            {t.emptyOutro}
          </p>
        )}

        {sorting.length > 0 && (
          <section aria-label={t.sortingLabel} className="mb-6">
            <ul className="space-y-1">
              {sorting.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center gap-3 rounded-lg border border-dashed border-line px-3 py-3 text-muted"
                >
                  <span className="size-2 animate-pulse rounded-full bg-go" aria-hidden />
                  <span dir="auto" className="text-ink">
                    {item.name}
                  </span>
                  <span className="ms-auto text-sm">{t.sorting}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="space-y-7">
          {groups.map((group) => (
            <section key={group.id} aria-labelledby={`category-${group.id}`}>
              <h2
                id={`category-${group.id}`}
                className="mb-2 flex min-w-0 items-center justify-between gap-2 border-b-2 pb-1"
                style={{ borderColor: group.color }}
              >
                <span className="font-display min-w-0 text-xl leading-tight font-bold tracking-tight text-balance sm:text-2xl">
                  <span aria-hidden className="me-2">
                    {group.emoji}
                  </span>
                  {group.name[locale]}
                </span>
                <span className="shrink-0 text-sm text-muted">{group.items.length}</span>
              </h2>

              <ul>
                {group.items.map((item) => (
                  <li key={item.id} className="animate-land">
                    <div className="flex items-center gap-1">
                      <label className="grid size-12 shrink-0 cursor-pointer place-items-center">
                        <input
                          type="checkbox"
                          checked={item.done}
                          onChange={() => toggle(item.id)}
                          className="size-5 cursor-pointer"
                          style={{ accentColor: group.color }}
                        />
                      </label>
                      {/* Tapping the name opens the quantity stepper. */}
                      <button
                        type="button"
                        onClick={() => setOpenId(openId === item.id ? null : item.id)}
                        aria-expanded={openId === item.id}
                        aria-label={t.quantityLabel(item.name)}
                        className="flex min-h-12 min-w-0 flex-1 items-center gap-2 rounded-lg px-2 text-start hover:bg-surface"
                      >
                        <span
                          dir="auto"
                          className={`min-w-0 text-lg transition-colors ${item.done ? "text-muted line-through decoration-2" : ""}`}
                        >
                          {item.name}
                        </span>
                        {item.quantity > 1 && (
                          <span
                            className="shrink-0 rounded-md px-1.5 text-sm font-bold text-white"
                            style={{ backgroundColor: group.color }}
                          >
                            ×{item.quantity}
                          </span>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(item.id)}
                        aria-label={t.removeItem(item.name)}
                        className="grid size-10 shrink-0 place-items-center rounded-lg text-xl text-muted opacity-60 hover:bg-surface hover:text-ink hover:opacity-100 focus-visible:opacity-100"
                      >
                        ×
                      </button>
                    </div>

                    {openId === item.id && (
                      <div className="ms-12 mb-2 flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= MIN_QUANTITY}
                          aria-label={t.decreaseQuantity}
                          className="grid size-11 place-items-center rounded-lg border border-line bg-surface text-2xl disabled:opacity-40"
                        >
                          −
                        </button>
                        <output aria-live="polite" className="font-display w-12 text-center text-2xl font-bold">
                          {item.quantity}
                        </output>
                        <button
                          type="button"
                          onClick={() => setQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= MAX_QUANTITY}
                          aria-label={t.increaseQuantity}
                          className="grid size-11 place-items-center rounded-lg border border-line bg-surface text-2xl disabled:opacity-40"
                        >
                          +
                        </button>
                      </div>
                    )}
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
              {t.errors[notice]}
            </p>
          )}
          <div className="flex gap-2">
            <label htmlFor="new-item" className="sr-only">
              {t.itemToAdd}
            </label>
            <input
              ref={inputRef}
              id="new-item"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={t.placeholder}
              autoComplete="off"
              enterKeyHint="done"
              className="min-h-12 min-w-0 flex-1 rounded-lg border border-line bg-surface px-4 text-lg placeholder:text-muted/70"
            />
            <button
              type="submit"
              disabled={!draft.trim()}
              className="min-h-12 shrink-0 rounded-lg bg-go px-5 font-bold text-go-ink disabled:opacity-40"
            >
              {t.addItem}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

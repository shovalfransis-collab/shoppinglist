"use client";

import { useMemo, useRef, useState } from "react";
import { CATEGORIES, FALLBACK_CATEGORY } from "@/lib/categories";
import { useLocale, useT, type ErrorCode } from "@/lib/i18n";
import { MAX_QUANTITY, MIN_QUANTITY, type Item, type ShoppingListData } from "@/lib/storage";
import { itemKey, parseItem } from "@/lib/parseItem";
import ConfirmDialog from "./ConfirmDialog";
import LanguageSwitch from "./LanguageSwitch";

// "milk, eggs\nbread" -> ["milk", "eggs", "bread"], so a whole list can be pasted at once.
function splitInput(text: string): string[] {
  return text
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function ListView({
  list,
  updateItems,
  onBack,
}: {
  list: ShoppingListData;
  updateItems: (updater: (items: Item[]) => Item[]) => void;
  onBack: () => void;
}) {
  const items = list.items;
  const setItems = updateItems;
  const [confirmClear, setConfirmClear] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<{ id: string; name: string; count: number } | null>(null);
  const [draft, setDraft] = useState("");
  // Stored as a code (not text) so the message re-translates if the language is switched.
  const [notice, setNotice] = useState<ErrorCode | null>(null);
  const [openId, setOpenId] = useState<string | null>(null); // item whose quantity stepper is open
  const t = useT();
  const { locale } = useLocale();
  const inputRef = useRef<HTMLInputElement>(null);

  async function addItems(event: React.FormEvent) {
    event.preventDefault();
    const typed = splitInput(draft).map(parseItem);
    if (typed.length === 0) return;

    // Same item typed again ("zucchini", then "3 zucchinis") is merged into one row.
    const bumps = new Map<string, number>(); // existing item id -> extra quantity
    const fresh: Item[] = []; // genuinely new items
    for (const { name, quantity } of typed) {
      const key = itemKey(name);
      const existing = items.find((i) => itemKey(i.name) === key);
      const sameBatch = fresh.find((i) => itemKey(i.name) === key);
      if (existing) {
        bumps.set(existing.id, (bumps.get(existing.id) ?? 0) + quantity);
      } else if (sameBatch) {
        sameBatch.quantity = Math.min(MAX_QUANTITY, sameBatch.quantity + quantity);
      } else {
        fresh.push({ id: crypto.randomUUID(), name, category: null, done: false, quantity });
      }
    }

    setItems((prev) => [
      ...fresh,
      ...prev.map((i) =>
        bumps.has(i.id)
          ? // Needing more of something that was ticked off means it's not done any more.
            { ...i, quantity: Math.min(MAX_QUANTITY, i.quantity + bumps.get(i.id)!), done: false }
          : i,
      ),
    ]);
    setDraft("");
    inputRef.current?.focus();
    if (fresh.length === 0) return; // everything merged: nothing new to sort

    const names = fresh.map((i) => i.name);
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

  // Categories are a fixed set, so "deleting" one removes its items from this list.
  function deleteCategory() {
    if (categoryToDelete) setItems((prev) => prev.filter((i) => i.category !== categoryToDelete.id));
    setCategoryToDelete(null);
  }

  function clearAll() {
    setItems(() => []);
    setOpenId(null);
    setConfirmClear(false);
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
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onBack}
            className="-ms-2 flex min-h-11 items-center gap-2 rounded-lg px-2 font-bold"
          >
            {/* Arrow points "back": left in English, right in Hebrew. */}
            <span aria-hidden className="inline-block text-xl rtl:rotate-180">
              ←
            </span>
            {t.backToLists}
          </button>
          <LanguageSwitch />
        </div>
        <h1
          dir="auto"
          className="font-display mt-4 text-4xl leading-tight font-extrabold tracking-tight [overflow-wrap:anywhere]"
        >
          {list.name}
        </h1>
        <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-muted">
          {/* Counts items, not units: "2 tomatoes" is one item. */}
          <p aria-live="polite">
            {items.length === 0 ? (
              t.subtitle
            ) : (
              <>
                <span className="font-display text-2xl font-bold text-ink">
                  {t.progress(checked, items.length)}
                </span>
                {left === 0 && <span> · {t.allInCart}</span>}
              </>
            )}
          </p>
          <div className="flex flex-wrap justify-end gap-x-3">
            {checked > 0 && (
              <button
                type="button"
                onClick={clearChecked}
                className="shrink-0 rounded-md px-2 py-1 text-sm font-bold text-ink underline decoration-line underline-offset-4 hover:decoration-ink"
              >
                {t.clearChecked(checked)}
              </button>
            )}
            {items.length > 0 && (
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                className="shrink-0 rounded-md px-2 py-1 text-sm font-bold text-danger underline decoration-line underline-offset-4 hover:decoration-danger"
              >
                {t.clearList}
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 pb-36">
        {items.length === 0 && (
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
              <h2 id={`category-${group.id}`} className="mb-2 border-b-2" style={{ borderColor: group.color }}>
                {/* Tapping the heading asks whether to delete this category's items. */}
                <button
                  type="button"
                  aria-haspopup="dialog"
                  onClick={() =>
                    setCategoryToDelete({ id: group.id, name: group.name[locale], count: group.items.length })
                  }
                  className="flex min-h-11 w-full min-w-0 items-center justify-between gap-2 rounded-lg px-1 text-start hover:bg-surface"
                >
                  <span className="font-display min-w-0 text-xl leading-tight font-bold tracking-tight text-balance sm:text-2xl">
                    <span aria-hidden className="me-2">
                      {group.emoji}
                    </span>
                    {group.name[locale]}
                  </span>
                  <span className="shrink-0 text-sm text-muted">{group.items.length}</span>
                </button>
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

      <ConfirmDialog
        open={categoryToDelete !== null}
        title={t.deleteCategoryTitle(categoryToDelete?.name ?? "")}
        body={t.deleteCategoryBody(categoryToDelete?.count ?? 0)}
        confirmLabel={t.deleteCategoryConfirm}
        onConfirm={deleteCategory}
        onCancel={() => setCategoryToDelete(null)}
      />

      <ConfirmDialog
        open={confirmClear}
        title={t.clearListTitle}
        body={t.clearListBody(items.length)}
        confirmLabel={t.clearListConfirm}
        onConfirm={clearAll}
        onCancel={() => setConfirmClear(false)}
      />

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

"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n";
import { MAX_LIST_NAME, type ShoppingListData } from "@/lib/storage";
import ConfirmDialog from "./ConfirmDialog";
import LanguageSwitch from "./LanguageSwitch";

// The landing screen: pick a list, make a new one, or delete one.
export default function ListPicker({
  lists,
  onOpen,
  onCreate,
  onDelete,
}: {
  lists: ShoppingListData[];
  onOpen: (id: string) => void;
  onCreate: (name: string) => void;
  onDelete: (id: string) => void;
}) {
  const t = useT();
  const [draft, setDraft] = useState("");
  const [toDelete, setToDelete] = useState<ShoppingListData | null>(null);

  function create(event: React.FormEvent) {
    event.preventDefault();
    const name = draft.trim();
    if (!name) return;
    onCreate(name);
    setDraft("");
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col px-4">
      <header className="pt-6 pb-6">
        <div className="flex items-start justify-between gap-4">
          <h1 className="font-display pt-4 text-5xl leading-none font-extrabold tracking-tight">
            {t.title}
          </h1>
          <LanguageSwitch />
        </div>
        <p className="mt-3 text-muted">{lists.length === 0 ? t.noLists : t.chooseList}</p>
      </header>

      <main className="flex-1 pb-36">
        <ul className="space-y-2">
          {lists.map((list) => {
            const left = list.items.filter((i) => !i.done).length;
            return (
              <li key={list.id} className="flex items-stretch gap-1">
                <button
                  type="button"
                  onClick={() => onOpen(list.id)}
                  className="min-w-0 flex-1 rounded-xl border border-line bg-surface px-4 py-3 text-start hover:border-ink"
                >
                  <span dir="auto" className="font-display block text-2xl leading-tight font-bold [overflow-wrap:anywhere]">
                    {list.name}
                  </span>
                  <span className="mt-1 block text-sm text-muted">
                    {t.listSummary(list.items.length, left)}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setToDelete(list)}
                  aria-label={t.deleteListLabel(list.name)}
                  className="grid w-12 shrink-0 place-items-center rounded-xl text-xl text-muted opacity-60 hover:bg-surface hover:text-ink hover:opacity-100 focus-visible:opacity-100"
                >
                  ×
                </button>
              </li>
            );
          })}
        </ul>
      </main>

      <div className="fixed inset-x-0 bottom-0 border-t border-line bg-ground/90 backdrop-blur">
        <form
          onSubmit={create}
          className="mx-auto flex max-w-xl gap-2 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
        >
          <label htmlFor="new-list" className="sr-only">
            {t.newListLabel}
          </label>
          <input
            id="new-list"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={MAX_LIST_NAME}
            placeholder={t.newListPlaceholder}
            autoComplete="off"
            enterKeyHint="done"
            className="min-h-12 min-w-0 flex-1 rounded-lg border border-line bg-surface px-4 text-lg placeholder:text-muted/70"
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            className="min-h-12 shrink-0 rounded-lg bg-go px-5 font-bold text-go-ink disabled:opacity-40"
          >
            {t.createList}
          </button>
        </form>
      </div>

      <ConfirmDialog
        open={toDelete !== null}
        title={t.deleteListTitle(toDelete?.name ?? "")}
        body={t.deleteListBody(toDelete?.items.length ?? 0)}
        confirmLabel={t.deleteListConfirm}
        onConfirm={() => {
          if (toDelete) onDelete(toDelete.id);
          setToDelete(null);
        }}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}

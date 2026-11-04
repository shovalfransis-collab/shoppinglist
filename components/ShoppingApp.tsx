"use client";

import { useEffect, useState } from "react";
import { dictionaries, getCurrentLocale } from "@/lib/i18n";
import { loadLists, saveLists, MAX_LIST_NAME, type Item, type ShoppingListData } from "@/lib/storage";
import ListPicker from "./ListPicker";
import ListView from "./ListView";

// Owns all the lists. Always opens on the picker; opening a list shows it with a back button.
export default function ShoppingApp() {
  const [lists, setLists] = useState<ShoppingListData[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading localStorage must wait for the browser
    setLists(loadLists(dictionaries[getCurrentLocale()].defaultListName));
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) saveLists(lists);
  }, [lists, loaded]);

  // The phone's back gesture / browser back button returns to the picker instead of leaving the site.
  useEffect(() => {
    const onPop = () => setActiveId(null);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  function openList(id: string) {
    window.history.pushState(null, "");
    setActiveId(id);
  }

  function goBack() {
    window.history.back(); // fires popstate, which shows the picker
  }

  function createList(name: string) {
    const list: ShoppingListData = { id: crypto.randomUUID(), name: name.slice(0, MAX_LIST_NAME), items: [] };
    setLists((prev) => [...prev, list]);
    openList(list.id);
  }

  function deleteList(id: string) {
    setLists((prev) => prev.filter((l) => l.id !== id));
  }

  // Keyed by list id (not "the open list") so a slow AI answer still lands in the right list.
  function updateItems(listId: string, updater: (items: Item[]) => Item[]) {
    setLists((prev) => prev.map((l) => (l.id === listId ? { ...l, items: updater(l.items) } : l)));
  }

  if (!loaded) return null;

  const active = lists.find((l) => l.id === activeId);
  if (active) {
    return (
      <ListView
        key={active.id}
        list={active}
        updateItems={(updater) => updateItems(active.id, updater)}
        onBack={goBack}
      />
    );
  }

  return <ListPicker lists={lists} onOpen={openList} onCreate={createList} onDelete={deleteList} />;
}

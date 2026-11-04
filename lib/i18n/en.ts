import type { Dictionary } from "./types";

export const en: Dictionary = {
  languageName: "English",
  switchLanguageLabel: "Switch language",
  meta: {
    title: "shoppinglist",
    description: "Add an item and it's sorted into the right category for you.",
  },
  title: "shoppinglist",
  subtitle: "Sorted by category, automatically.",
  leftToGet: (count) => `${count} left to get`,
  allInCart: "Everything's in the cart.",
  clearChecked: (count) => `Clear ${count} checked`,
  emptyIntro: "Your list is empty. Type what you need below, like",
  emptyExample: "milk, eggs, bread",
  emptyOutro: ", and each item goes to its category.",
  sortingLabel: "Sorting",
  sorting: "sorting…",
  quantityLabel: (name) => `Quantity of ${name}`,
  increaseQuantity: "One more",
  decreaseQuantity: "One less",
  removeItem: (name) => `Remove ${name}`,
  itemToAdd: "Item to add",
  placeholder: "milk, eggs, bread…",
  addItem: "Add item",
  errors: {
    bad_request: "Couldn't read that. Try adding the items again.",
    missing_key: "The sorting agent isn't set up yet: add OPENROUTER_API_KEY to the environment.",
    agent_failed: "The sorting agent didn't answer. Items were put in Other.",
    offline: "You're offline. Items were put in Other.",
  },
};

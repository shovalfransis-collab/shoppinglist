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
  progress: (checked, total) => `${checked} out of ${total}`,
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
  defaultListName: "My list",
  chooseList: "Choose a list, or start a new one.",
  noLists: "No lists yet. Name your first one below.",
  newListLabel: "List name",
  newListPlaceholder: "Groceries, pharmacy…",
  createList: "Create list",
  listSummary: (total, left) =>
    total === 0 ? "Empty" : left === 0 ? `All ${total} in the cart` : `${left} of ${total} left`,
  backToLists: "All lists",
  deleteListLabel: (name) => `Delete list ${name}`,
  cancel: "Cancel",
  clearList: "Clear list",
  clearListTitle: "Clear the whole list?",
  clearListBody: (count) =>
    `This removes ${count === 1 ? "the 1 item" : `all ${count} items`} from the list. You can't undo it.`,
  clearListConfirm: "Yes, clear it",
  deleteListTitle: (name) => `Delete "${name}"?`,
  deleteListBody: (count) =>
    count === 0
      ? "The list will be gone for good. You can't undo it."
      : `The list and ${count === 1 ? "its 1 item" : `its ${count} items`} will be gone for good. You can't undo it.`,
  deleteListConfirm: "Yes, delete it",
  deleteCategoryTitle: (name) => `Delete "${name}"?`,
  deleteCategoryBody: (count) =>
    `This removes ${count === 1 ? "its 1 item" : `all ${count} items`} in this category from the list. You can't undo it.`,
  deleteCategoryConfirm: "Yes, delete it",
};

// Shared i18n types. To add a language: add its code to LOCALES, create <code>.ts with a
// Dictionary, register it in index.tsx, and give every category a name in lib/categories.ts.

export const LOCALES = ["en", "he"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";
export const RTL_LOCALES: readonly Locale[] = ["he"];

// Codes the API can send back instead of English text; the client translates them.
export type ErrorCode = "bad_request" | "missing_key" | "agent_failed" | "offline";

// Every key here must exist in every language file, or the build fails.
export type Dictionary = {
  languageName: string; // the language's own name, shown on the switch
  switchLanguageLabel: string; // aria-label for the switch
  meta: { title: string; description: string };
  title: string;
  subtitle: string;
  leftToGet: (count: number) => string;
  allInCart: string;
  clearChecked: (count: number) => string;
  emptyIntro: string;
  emptyExample: string;
  emptyOutro: string;
  sortingLabel: string;
  sorting: string;
  quantityLabel: (name: string) => string;
  increaseQuantity: string;
  decreaseQuantity: string;
  removeItem: (name: string) => string;
  itemToAdd: string;
  placeholder: string;
  addItem: string;
  errors: Record<ErrorCode, string>;
};

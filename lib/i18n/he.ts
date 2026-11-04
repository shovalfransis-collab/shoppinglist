import type { Dictionary } from "./types";

export const he: Dictionary = {
  languageName: "עברית",
  switchLanguageLabel: "החלפת שפה",
  meta: {
    title: "רשימת קניות",
    description: "מוסיפים מוצר והוא מסודר אוטומטית בקטגוריה הנכונה.",
  },
  title: "רשימת קניות",
  subtitle: "מסודר לפי קטגוריות, אוטומטית.",
  // Hebrew singular and plural differ in word order and form.
  leftToGet: (count) => (count === 1 ? "נשאר פריט 1" : `נשארו ${count} פריטים`),
  allInCart: "הכול בעגלה.",
  clearChecked: (count) => (count === 1 ? "נקה פריט מסומן" : `נקה ${count} פריטים מסומנים`),
  emptyIntro: "הרשימה ריקה. כתבו למטה מה צריך, למשל",
  emptyExample: "חלב, ביצים, לחם",
  emptyOutro: ", וכל פריט ילך לקטגוריה שלו.",
  sortingLabel: "מסדר",
  sorting: "ממיין…",
  quantityLabel: (name) => `כמות של ${name}`,
  increaseQuantity: "אחד נוסף",
  decreaseQuantity: "אחד פחות",
  removeItem: (name) => `הסר את ${name}`,
  itemToAdd: "פריט להוספה",
  placeholder: "חלב, ביצים, לחם…",
  addItem: "הוסף פריט",
  errors: {
    bad_request: "לא הצלחתי לקרוא את זה. נסו להוסיף את הפריטים שוב.",
    missing_key: "הסוכן המסדר עדיין לא מוגדר: הוסיפו את OPENROUTER_API_KEY לסביבה.",
    agent_failed: "הסוכן המסדר לא ענה. הפריטים הועברו ל״אחר״.",
    offline: "אין חיבור לאינטרנט. הפריטים הועברו ל״אחר״.",
  },
};

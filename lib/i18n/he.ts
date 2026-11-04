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
  progress: (checked, total) => `${checked} מתוך ${total}`,
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
  defaultListName: "הרשימה שלי",
  chooseList: "בחרו רשימה, או פתחו חדשה.",
  noLists: "עוד אין רשימות. תנו שם לרשימה הראשונה למטה.",
  newListLabel: "שם הרשימה",
  newListPlaceholder: "סופר, בית מרקחת…",
  createList: "צור רשימה",
  listSummary: (total, left) => {
    if (total === 0) return "ריקה";
    if (left === 0) return total === 1 ? "הפריט בעגלה" : `כל ${total} הפריטים בעגלה`;
    return `נשארו ${left} מתוך ${total}`;
  },
  backToLists: "כל הרשימות",
  deleteListLabel: (name) => `מחק את הרשימה ${name}`,
  cancel: "ביטול",
  clearList: "נקה רשימה",
  clearListTitle: "לנקות את כל הרשימה?",
  clearListBody: (count) =>
    `פעולה זו תסיר ${count === 1 ? "את הפריט היחיד" : `את כל ${count} הפריטים`} מהרשימה. אי אפשר לבטל אותה.`,
  clearListConfirm: "כן, נקה",
  deleteListTitle: (name) => `למחוק את "${name}"?`,
  deleteListBody: (count) =>
    count === 0
      ? "הרשימה תימחק לצמיתות. אי אפשר לבטל את זה."
      : `הרשימה ${count === 1 ? "והפריט שבה" : `ו-${count} הפריטים שבה`} יימחקו לצמיתות. אי אפשר לבטל את זה.`,
  deleteListConfirm: "כן, מחק",
  deleteCategoryTitle: (name) => `למחוק את "${name}"?`,
  deleteCategoryBody: (count) =>
    `פעולה זו תסיר ${count === 1 ? "את הפריט היחיד" : `את כל ${count} הפריטים`} בקטגוריה הזו מהרשימה. אי אפשר לבטל אותה.`,
  deleteCategoryConfirm: "כן, מחק",
};

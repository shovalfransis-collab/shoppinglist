# 🛒 shoppinglist

A smart shopping list. You type an item, and an AI agent sorts it into the right category for you, so your list arrives already organized by category.

> Type **"milk"** and it lands under **Dairy & Eggs**. Type **"bananas"** and it lands under **Fruits & Vegetables**. No dropdowns, no manual sorting.

## How it works

1. Type something (e.g. `milk`, or a few at once: `milk, eggs, bread`) and hit **Add item**.
2. The item is sent to an AI agent (an OpenAI model, called through **OpenRouter**).
3. The agent returns a category id (e.g. `dairy_eggs`), shown by name in the current language (Dairy & Eggs / מוצרי חלב וביצים).
4. The list re-renders, grouped by category, as a clean categorized view.

```
[ Add item: "milk" ] ──► /api/categorize ──► OpenRouter (OpenAI model) ──► "dairy_eggs"
                                                                            │
                     ┌──────────────────────────────────────────────────────┘
                     ▼
               🥛 Dairy & Eggs 🥦 Fruits & Veg 🍞 Bakery
               - milk          - bananas        - sourdough
               - yogurt        - spinach
```

## Tech stack

| Layer      | Choice                                   |
|------------|------------------------------------------|
| Framework  | Next.js 16 (App Router) + TypeScript     |
| Styling    | Tailwind CSS                             |
| AI         | OpenAI model via OpenRouter API          |
| Hosting    | Vercel                                   |
| Languages  | English + Hebrew (RTL), own i18n in `lib/i18n` |

## Getting started

```bash
git clone https://github.com/shovalfransis-collab/shoppinglist.git
cd shoppinglist
npm install
cp .env.example .env.local   # then paste your OpenRouter key
npm run dev
```

Open http://localhost:3000.

### Environment variables

| Name                 | Where to get it                         | Notes                         |
|----------------------|-----------------------------------------|-------------------------------|
| `OPENROUTER_API_KEY` | https://openrouter.ai/keys              | Server-side only. Never commit it. |
| `OPENROUTER_MODEL`   | e.g. `openai/gpt-4o-mini`               | Optional, has a default       |

On Vercel, add these under **Project → Settings → Environment Variables**.

## Categories

14 categories in store-walk order. Items are stored by stable id, so changing language never breaks a saved list:

`fruits_veg` · `bakery` · `dairy_eggs` · `meat_chicken_fish` · `deli` · `pantry` · `spices_oils` · `sauces_spreads` · `snacks` · `drinks` · `frozen` · `cleaning` · `personal_care` · `household` · `other` (fallback, always last)

## Languages

The UI is available in English and Hebrew (fully right-to-left), with a switch in the header. The first visit follows the browser language; the choice is remembered. All text lives in `lib/i18n/` (`en.ts`, `he.ts`). To add a language, add one dictionary file, register it, and add a name for each category in `lib/categories.ts`.

## Roadmap

- [x] Repo, Vercel project, docs
- [x] Next.js + Tailwind scaffold
- [x] `Add item` input + list UI
- [x] `/api/categorize` route calling OpenRouter
- [x] Grouped, categorized list view
- [x] Persist the list in the browser (localStorage)
- [ ] Move an item to a different category by hand
- [ ] Sync the list across devices (database)
- [x] Check off / remove items
- [x] Category icons and colored category headings
- [x] Tap an item to set its quantity
- [x] 14 store categories with stable ids
- [x] Hebrew / English with RTL layout

## License

MIT

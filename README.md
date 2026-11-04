# 🛒 shoppinglist

A smart shopping list. You type an item, and an AI agent sorts it into the right category for you, so your list arrives already organized by aisle.

> Type **"milk"** and it lands under **Dairy**. Type **"bananas"** and it lands under **Produce**. No dropdowns, no manual sorting.

## How it works

1. Type something (e.g. `milk`, or a few at once: `milk, eggs, bread`) and hit **Add item**.
2. The item is sent to an AI agent (an OpenAI model, called through **OpenRouter**).
3. The agent returns a category (e.g. `Dairy`).
4. The list re-renders, grouped by category, as a clean categorized view.

```
[ Add item: "milk" ] ──► /api/categorize ──► OpenRouter (OpenAI model) ──► "Dairy"
                                                                            │
                     ┌──────────────────────────────────────────────────────┘
                     ▼
               🥛 Dairy        🥦 Produce       🍞 Bakery
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

## Roadmap

- [x] Repo, Vercel project, docs
- [x] Next.js + Tailwind scaffold
- [x] `Add item` input + list UI
- [x] `/api/categorize` route calling OpenRouter
- [x] Grouped, categorized list view
- [x] Persist the list in the browser (localStorage)
- [ ] Move an item to a different aisle by hand
- [ ] Sync the list across devices (database)
- [x] Check off / remove items
- [x] Category icons and aisle-sign styling

## License

MIT

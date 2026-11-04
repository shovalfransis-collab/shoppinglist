# CLAUDE.md

Guidance for Claude (and any AI coding agent) working in this repo.

## What this project is

**shoppinglist** is a glorified shopping list. The user adds an item ("milk"), an AI agent categorizes it ("Dairy & Eggs"), and the UI shows every item grouped under its category. The whole point is to **save the user time and effort**, so keep the flow to one input and zero manual sorting.

The owner is learning as a "vibe coder". When you make a non-obvious choice, add a one-line explanation in the PR or chat so he learns *why*.

## Stack (don't change it without asking)

- **Next.js 16** (App Router) + **TypeScript**. This version is newer than most AI training data: read `AGENTS.md` and the docs in `node_modules/next/dist/docs/` before using an API you're unsure of.
- **Tailwind CSS v4** for styling (theme tokens live in `app/globals.css`)
- Fonts are self-hosted via `@fontsource` packages + `next/font/local` (no Google Fonts fetch at build time)
- **OpenRouter** as the AI gateway, using an **OpenAI model** (default `openai/gpt-4o-mini`)
- Deployed on **Vercel** (pushes to `main` auto-deploy)

## Architecture

```
app/
  page.tsx                 # renders <ShoppingList />
  layout.tsx               # fonts (incl. Hebrew), metadata, language init script, <I18nProvider>
  globals.css              # color tokens (light + dark), one motion
  api/categorize/route.ts  # server route: items -> categories via OpenRouter
components/
  ShoppingList.tsx         # client UI: Add item bar, aisle-grouped list, localStorage
lib/
  categories.ts            # 15 fixed categories (stable id, emoji, color, en/he name) in store-walk order (= aisle number)
  i18n/                    # en.ts + he.ts dictionaries, typed helper, useT() hook, lang init script
  openrouter.ts            # server-only fetch wrapper for OpenRouter
```

- The AI call happens **only on the server** (`app/api/categorize/route.ts`). The API key must never reach the browser.
- OpenRouter endpoint: `POST https://openrouter.ai/api/v1/chat/completions` with `Authorization: Bearer $OPENROUTER_API_KEY`. It uses the OpenAI chat format.
- The agent must pick from a **fixed category list** in `lib/categories.ts`: fruits_veg, bakery, dairy_eggs, meat_chicken_fish, deli, pantry, spices_sauces, breakfast, snacks, drinks, frozen, cleaning, personal_care, household, other. Categories are stored and returned by **stable id**, never by display name. The API takes a batch: `POST /api/categorize { "items": ["milk","bananas"] }` returns `{ "categories": ["dairy_eggs","fruits_veg"] }` (one per item, same order). Anything that isn't a valid id becomes `other`. Errors are codes (`bad_request`, `missing_key`, `agent_failed`), not English text; the client translates them.
- The input accepts several items at once, separated by commas or new lines.
- The list is saved in the browser's localStorage for now (key `shoppinglist:v2`; v1 used category names and is migrated once on load). The chosen language is saved under `shoppinglist:lang`.
- Keep the prompt short and deterministic (`temperature: 0`).

## Environment variables

- `OPENROUTER_API_KEY`: required, server-side only
- `OPENROUTER_MODEL`: optional, defaults to `openai/gpt-4o-mini`

Keep `.env.local` out of git. Keep `.env.example` updated with names only, no values.

## Commands

```bash
npm run dev     # local dev on http://localhost:3000
npm run build   # production build (run before pushing)
npm run lint
```

## Rules

- **Git authorship:** commits are authored by the repo owner only. Do **not** add `Co-Authored-By` trailers, "Generated with Claude" lines, or any AI attribution to commits or PRs. Do not list Claude as a contributor anywhere.
- **All UI text lives in `lib/i18n`. Never hardcode strings in components. Every new string needs both `en` and `he`. Use logical (start/end) classes for RTL (`ms-`/`me-`/`ps-`/`pe-`/`start-`/`end-`/`text-start`), never `ml-`/`mr-`/`pl-`/`pr-`/`left-`/`right-`.**
- Never commit secrets or `.env*` files (except `.env.example`).
- Dependencies are pinned to exact versions in `package.json`.
- Small, focused commits with clear messages (`feat: add categorize route`).
- Run `npm run build` before saying something is done.
- Mobile-first UI. People use shopping lists in the store on their phone.
- Update `README.md` (roadmap checkboxes) when a feature lands.
- The owner keeps project notes in Obsidian (`shoppinglist` note). When a milestone lands, summarize it so he can paste it there.

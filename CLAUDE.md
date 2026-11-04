# CLAUDE.md

Guidance for Claude (and any AI coding agent) working in this repo.

## What this project is

**shoppinglist** is a glorified shopping list. The user adds an item ("milk"), an AI agent categorizes it ("Dairy"), and the UI shows every item grouped under its category. The whole point is to **save the user time and effort**, so keep the flow to one input and zero manual sorting.

The owner is learning as a "vibe coder". When you make a non-obvious choice, add a one-line explanation in the PR or chat so he learns *why*.

## Stack (don't change it without asking)

- **Next.js** (App Router) + **TypeScript**
- **Tailwind CSS** for styling
- **OpenRouter** as the AI gateway, using an **OpenAI model** (default `openai/gpt-4o-mini`)
- Deployed on **Vercel** (pushes to `main` auto-deploy)

## Architecture

```
app/
  page.tsx                 # the list UI: Add item input + grouped list
  api/categorize/route.ts  # server route: item -> category via OpenRouter
lib/
  categories.ts            # the fixed list of allowed categories
  openrouter.ts            # small fetch wrapper for OpenRouter
```

- The AI call happens **only on the server** (`app/api/categorize/route.ts`). The API key must never reach the browser.
- OpenRouter endpoint: `POST https://openrouter.ai/api/v1/chat/completions` with `Authorization: Bearer $OPENROUTER_API_KEY`. It uses the OpenAI chat format.
- The agent must pick from a **fixed category list** in `lib/categories.ts` (e.g. Produce, Dairy, Meat & Fish, Bakery, Pantry, Frozen, Drinks, Snacks, Household, Personal Care, Other). Return JSON like `{ "category": "Dairy" }`. If the response isn't a valid category, fall back to `Other`.
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
- Never commit secrets or `.env*` files (except `.env.example`).
- Small, focused commits with clear messages (`feat: add categorize route`).
- Run `npm run build` before saying something is done.
- Mobile-first UI. People use shopping lists in the store on their phone.
- Update `README.md` (roadmap checkboxes) when a feature lands.
- The owner keeps project notes in Obsidian (`shoppinglist` note). When a milestone lands, summarize it so he can paste it there.

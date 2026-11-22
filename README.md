# event_management_fe

React 19 + Vite + TypeScript + Tailwind v4 + shadcn/ui frontend for Event Management, deployed on **Cloudflare Pages**.

## Setup

```bash
npm install
cp .env.example .env          # set VITE_API_URL (defaults to http://localhost:4000)
npx playwright install chromium   # once, for e2e tests
npm run dev                   # http://localhost:5173
```

The home page calls `GET {VITE_API_URL}/health/ready` and shows whether the backend and its database are reachable.

## Scripts

| Command             | What it does                         |
| ------------------- | ------------------------------------ |
| `npm run dev`       | Start the dev server                 |
| `npm run build`     | Typecheck and build to `dist/`       |
| `npm run typecheck` | TypeScript only                      |
| `npm run lint`      | ESLint, zero warnings allowed        |
| `npm run format`    | Prettier (write)                     |
| `npm test`          | Vitest unit/component tests          |
| `npm run test:e2e`  | Playwright end-to-end tests (`e2e/`) |

Before saying a change is done: `npm run typecheck && npm run lint && npm test`.
A Husky pre-commit hook runs lint-staged (ESLint + Prettier) on staged files.

> **Windows note:** run `npm test` from `C:\Event_management\FE` (uppercase drive letter).
> From a lowercase `c:\…` path Vitest loads two copies of itself and every test fails with
> "failed to find the current suite".

## Project structure

```
src/app/                 router, providers, layouts
src/features/<feature>/  components/ hooks/ api/ (calls + zod schemas) index.ts
src/components/ui/       shadcn primitives (generated; add with `npx shadcn@latest add <name>`)
src/lib/                 api-client.ts, env.ts, format.ts, utils.ts
src/styles/globals.css   design tokens (keep in sync with docs/design-system/tokens.json)
docs/                    spec, steering document, design system
.claude/                 Claude Code hook, rules and skills
```

## Deploy to Cloudflare Pages

1. Cloudflare Dashboard → **Workers & Pages → Create → Pages → Connect to Git**, then select this repo.
2. Build settings:
   - Framework preset: **React (Vite)**
   - Build command: `npm run build`
   - Build output directory: `dist`
3. Environment variable: `VITE_API_URL` = your Northflank service URL (e.g. `https://api--event-be--xxxx.code.run`).
   It is baked in at build time, so redeploy after changing it.
4. Add the resulting `https://<project>.pages.dev` URL to the backend's `CORS_ORIGINS`.

`public/_redirects` handles SPA routing.

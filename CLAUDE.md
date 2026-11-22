# Wedding Planner — React 19 + Vite + TypeScript + Tailwind v4 + shadcn/ui

Multi-tenant wedding planning app. Product spec: `docs/spec.md`. Build one milestone at a time; acceptance criteria are the contract.

## Commands

- `npm run dev` · `npm run build` · `npm run lint` · `npm run typecheck` · `npm test` · `npm run test:e2e`
- Before saying a task is done: `npm run typecheck && npm run lint && npm test` must pass.

## Structure

```
src/app/            router, providers, layouts
src/features/<f>/   components/ hooks/ api/ (calls + zod schemas) types.ts index.ts
src/components/ui/  shadcn primitives — generated, do not hand-edit
src/components/shared/  app-wide composites
src/hooks/  src/lib/ (utils.ts cn(), api-client.ts, env.ts, format.ts)  src/styles/globals.css
```

Files are kebab-case (`order-list.tsx`); components PascalCase; hooks `useX`; named exports only.

## Non-negotiables

- One responsibility per component (~200 lines max). Business logic lives in hooks or plain functions; components render.
- Server data only through TanStack Query (query key factories, `queryOptions`). Never copy server data into `useState`.
- `useEffect` only to sync with external systems. Derive values during render. Never mutate state.
- React Compiler is on: no `useMemo` / `useCallback` / `memo` unless a comment says why.
- Typed `Props` for every component. No `any`, no `@ts-ignore`, no `!` without a comment.
- No inline styles (except a CSS variable for a runtime value). Tailwind classes bound to theme tokens; `cn()` + `cva` for variants. Never hard-code hex.
- Use a shadcn/ui primitive before building a custom one. Wrap, don't edit, `components/ui`.
- No DI containers, service locators or pass-through "service" layers.
- Forms: React Hook Form + Zod + shadcn `Field`. Validate API responses with Zod at the boundary.
- Money: whole rupees (int), shown via `formatINR()` in `lib/format.ts` (en-IN grouping). Dates in company time zone (default Asia/Kolkata).
- Every async UI handles loading (skeleton), empty, error and success.
- Accessibility: WCAG 2.2 AA, semantic HTML first, every input labelled, status never by colour alone.
- Every `eslint-disable` needs a reason (`-- why`).

## Where the details are (loaded on demand)

- `.claude/rules/` — detailed rules, auto-loaded for matching files.
- UI or design work → use the `ui-ux-designer` skill; it reads `docs/design-system/README.md`.
- Code review → `/react-review`.
- Full human reference: `docs/react-steering-document.md` (read only when asked).

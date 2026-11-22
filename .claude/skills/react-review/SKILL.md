---
name: react-review
description: Review changed React code against the project's standards and design system, with a ranked list of issues and fixes.
disable-model-invocation: true
---

# React code review

1. Get the change set: `git diff --stat` and `git diff` (or the files the user names).
2. Run `npm run typecheck` and `npm run lint`; include any failures.
3. Check each changed file against the checklist below. Report only real issues.
4. Output: a table — severity (Must / Should / Nit) · file:line · issue · fix. Then "Looks good" items in one line. Offer to apply the Must fixes.

## Checklist

**Architecture** — single responsibility; logic in hooks; correct feature folder; no duplication of an existing component/hook; no DI/service layers.
**State & hooks** — no derived state; no mutation; effects only for external systems; no fetch in effects; deps correct, never suppressed; no unjustified useMemo/useCallback/memo; `key` resets instead of reset effects.
**Data** — TanStack Query with key factory; Zod-parsed responses; no server data in useState; mutations invalidate; tenant id never trusted from UI.
**Props & types** — typed Props; native props extended; no `any`/`@ts-ignore`/unexplained `!`; no drilling > 2 levels; variant unions over booleans.
**Styling** — no inline styles/hex; tokens only; cn()/cva; shadcn primitive reused; gold used only for selection/progress/focus/links; one primary button.
**UX states** — loading skeleton, empty, error, success; destructive confirm/undo; mobile targets 48px.
**Accessibility** — semantic elements (button not div); labels; aria-describedby on errors; focus visible; status has word/icon; contrast via tokens.
**Formatting** — ₹ via formatINR (en-IN); dates in company time zone; tabular figures.
**Security** — no dangerouslySetInnerHTML without DOMPurify; no secrets; only VITE_* env via env.ts.
**Tests** — behaviour tests with getByRole; calculation rules covered; MSW for network.
**Hygiene** — no dead code/console.log; eslint-disable has reason; kebab-case files; named exports.

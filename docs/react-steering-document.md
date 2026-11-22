# React Development Standards — Steering Document

**Applies to:** all React projects built with Vite, TypeScript, Tailwind CSS v4 and shadcn/ui.
**Baseline (Nov 2026):** React 19.3, React Compiler 1.0, TypeScript 5.x (strict), ESLint 9 (flat config), TanStack Query v5, React Hook Form v7 + Zod v4, React Router, Vitest, React Testing Library, Playwright, WCAG 2.2 AA.

**How to read the rules:**

- 🔴 **MUST**: mandatory. Code review blocks the merge.
- 🟡 **SHOULD**: the default. Deviate only with a short written reason in the PR.
- 🟢 **MAY**: optional optimisation.
- ⛔ **AVOID**: an anti-pattern.

> For Claude Code: the short form of these rules lives in `CLAUDE.md` and `.claude/rules/`. This document is the human reference and explains the _why_.

---

## 1. Project structure

🔴 Organise code by feature. Shared primitives live in `components/ui` (shadcn) and `components/shared`. Feature code never imports from another feature's internals; it imports only that feature's `index.ts`.

```
src/
├── app/                    # router.tsx, providers.tsx, layouts/
├── features/
│   └── events/
│       ├── components/     # event-list.tsx, event-header.tsx
│       ├── hooks/          # use-events.ts, use-event.ts
│       ├── api/            # events.api.ts, events.schema.ts, events.keys.ts
│       ├── types.ts
│       └── index.ts        # the feature's public surface
├── components/
│   ├── ui/                 # shadcn primitives (generated, do not hand-edit)
│   └── shared/             # page-header.tsx, empty-state.tsx, money.tsx
├── hooks/                  # cross-feature hooks (use-media-query.ts)
├── lib/                    # utils.ts (cn), api-client.ts, env.ts, format.ts, query-client.ts
├── styles/globals.css
└── test/                   # setup.ts, msw handlers, render helpers
```

**Why:** related code changes together. Feature folders keep a change inside one directory and make dead code obvious.

**Naming:**

| Thing                         | Convention                          | Example                            |
| ----------------------------- | ----------------------------------- | ---------------------------------- |
| Files and folders             | kebab-case                          | `service-line-drawer.tsx`          |
| Components and types          | PascalCase                          | `ServiceLineDrawer`, `ServiceLine` |
| Hooks                         | `useX`, file `use-x.ts`             | `useServiceLines`                  |
| Functions and variables       | camelCase                           | `calculateLineTotal`               |
| Booleans                      | `is`/`has`/`can`                    | `isLocked`, `hasEnvelope`          |
| Event handler / callback prop | `handleX` / `onX`                   | `handleSave` / `onSave`            |
| Constants                     | UPPER_SNAKE only for true constants | `MAX_PHOTOS`                       |

🟡 Use named exports only. The exception is anything a tool requires as a default export.
⛔ Avoid `utils.ts` dumping grounds and barrel files that re-export the whole app.

---

## 2. Component architecture

🔴 **Single responsibility.** A component either decides (through a hook or container) or displays. If a file fetches data, holds form state _and_ lays out a complex UI, split it.

🔴 **Logic lives in hooks or plain functions**, not in JSX.

```tsx
// ⛔ Bad: fetching, filtering and rendering tangled together
export function TaskList({ eventId }: { eventId: string }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  useEffect(() => {
    fetch(`/api/events/${eventId}/tasks`)
      .then((r) => r.json())
      .then(setTasks);
  }, [eventId]);
  const today = tasks.filter((t) => t.dueDate === new Date().toISOString().slice(0, 10));
  return (
    <ul>
      {today.map((t, i) => (
        <li key={i}>{t.title}</li>
      ))}
    </ul>
  );
}

// ✅ Good
export function TodayTaskList({ eventId }: TodayTaskListProps) {
  const { data: tasks, isPending, error } = useTasks(eventId);
  if (isPending) return <TaskListSkeleton />;
  if (error) return <ErrorState error={error} />;
  const today = selectTodayTasks(tasks); // pure function in lib, unit-tested
  if (today.length === 0) return <EmptyState title="Nothing due today" />;
  return (
    <ul>
      {today.map((t) => (
        <TaskRow key={t.id} task={t} />
      ))}
    </ul>
  );
}
```

🟡 Keep component files to about 200 lines and functions to about 50. Going over is a signal to review, not an automatic failure.
🟡 Extract shared code on the second _real_ duplication, not the first one you imagine.
🔴 Never define a component inside another component, because it remounts and loses state on every render.
⛔ Avoid "god" components, deep inheritance-like wrappers, and HOCs for new code (use hooks instead).

**Common mistakes:** putting business rules (budget maths, date rules) in components; copying a near-identical component instead of adding a variant.

---

## 3. State management and hooks

🔴 **Declare state with `const`, and never mutate it.**

```tsx
const [items, setItems] = useState<Item[]>([]);
// ⛔ items.push(item); setItems(items);
// ✅
setItems((prev) => [...prev, item]);
setUser((prev) => ({ ...prev, name }));
```

🔴 **Follow the Rules of Hooks:** call them at the top level only, and only from components or custom hooks. ESLint enforces this.

🔴 **Don't store derived state.** Compute it during render.

```tsx
// ⛔ Extra render, stale frame, possible loop
const [total, setTotal] = useState(0);
useEffect(() => setTotal(rows.reduce((s, r) => s + (r.budget ?? 0), 0)), [rows]);

// ✅
const total = rows.reduce((sum, row) => sum + (row.budget ?? 0), 0);
```

🔴 **`useEffect` is only for syncing with external systems:** subscriptions, timers, browser APIs and non-React widgets. User actions belong in event handlers, and data fetching goes through TanStack Query.

```tsx
// ⛔ Effect reacting to a click via state
useEffect(() => {
  if (submitted) toast('Saved');
}, [submitted]);
// ✅
function handleSubmit() {
  save();
  toast('Saved');
}
```

🔴 **Never suppress `exhaustive-deps`.** Fix the cause instead: move the function inside the effect, depend on primitives, or use `useEffectEvent` for non-reactive logic.

🟡 **To reset state on an identity change, use `key`:**

```tsx
<ServiceLineDrawer key={serviceLineId} serviceLineId={serviceLineId} />
```

🟡 **Model related flags as one state** (a discriminated union or `useReducer`):

```tsx
type SaveState = { status: 'idle' } | { status: 'saving' } | { status: 'error'; message: string };
```

🟡 **Memoization (React Compiler on):** don't write `useMemo`, `useCallback` or `memo` by default, because the compiler memoizes automatically. Keep them only as an escape hatch, with a `// why:` comment, for example a third-party library that compares function references.

**Where state lives:**

| Kind                                                 | Where                               |
| ---------------------------------------------------- | ----------------------------------- |
| Server data (events, vendors, tasks)                 | TanStack Query cache                |
| Form state                                           | React Hook Form                     |
| URL state (filters, selected tab, function switcher) | the router's search params          |
| Local UI (open/closed, hover)                        | `useState` in the nearest component |
| Low-frequency global (theme, session)                | Context                             |
| Complex, frequently-updated shared UI state          | Zustand (needs a reason in the PR)  |

⛔ Avoid copying server data into `useState` or Context, and avoid using Redux for server data.

---

## 4. Dependency management (no DI)

🔴 Don't use dependency-injection containers, service locators or "manager" classes. Bring dependencies in through ES module imports, props, hooks and Context.

```tsx
// ⛔ const svc = container.get<IEventService>(TYPES.EventService);
// ✅ import { getEvent } from '@/features/events/api/events.api';
```

🟡 For tests, replace the **network** with MSW, not your modules.
⛔ Avoid wrapper classes around `fetch` that add nothing, and "service" layers that only pass calls through.

🔴 **Adding a package needs a reason:** check its maintenance, bundle size and licence, and whether the platform or an existing dependency already does the job. Pin exact versions through the lockfile and install with `npm ci` in CI.

---

## 5. Styling

🔴 **No inline styles.** Use Tailwind classes bound to theme tokens (`bg-background`, `text-muted-foreground`, `bg-gold-soft`, `text-danger`). Never hard-code hex values.

```tsx
// ⛔ <div style={{ padding: 16, color: '#625a4e' }}>
// ✅ <div className="p-4 text-muted-foreground">
```

🟡 **The one exception** is a runtime value passed as a CSS variable (ESLint allows only `--` keys inside `style`):

```tsx
<div
  className="h-2 w-(--pct) rounded-full bg-gold"
  style={{ '--pct': `${pct}%` } as React.CSSProperties}
/>
```

🔴 Merge classes with `cn()` and define variants with `cva`:

```tsx
const badge = cva('inline-flex items-center rounded-sm px-2 py-0.5 text-caption font-medium', {
  variants: {
    tone: {
      neutral: 'bg-muted text-muted-foreground',
      success: 'bg-success-soft text-success',
      warning: 'bg-warning-soft text-warning',
      danger: 'bg-danger-soft text-danger',
    },
  },
  defaultVariants: { tone: 'neutral' },
});
```

🔴 Write mobile-first responsive styles (`sm:`, `md:`, `lg:`). Take spacing from the 4px scale. Arbitrary values like `p-[13px]` need a reason.
🔴 Follow the design system in `docs/design-system/README.md`: one primary button per view, gold only for selection, progress, links and focus, and status shown with a colour _and_ a word or icon.
🟡 Let `prettier-plugin-tailwindcss` sort classes automatically.

---

## 6. UI components (shadcn/ui)

🔴 Use a shadcn primitive (Dialog, Sheet, Select, Popover, Command, Tabs, Table, Field and so on) before building a custom one. They give you keyboard and ARIA behaviour for free.
🔴 Treat `src/components/ui/*` as vendor code. Put product-specific behaviour in wrappers in `components/shared`, so `npx shadcn add` updates stay clean.
🔴 Customise through tokens (`globals.css`), not through per-component colour overrides.
⛔ Avoid mixing in a second component library (MUI, Chakra, Ant).

---

## 7. Props and component communication

🔴 Give every component an explicit `Props` type. Use `type`, not `interface` (one style everywhere; enforced by ESLint).

```tsx
type MoneyProps = React.ComponentProps<'span'> & { amount: number; compact?: boolean };

export function Money({ amount, compact = false, className, ...rest }: MoneyProps) {
  return (
    <span className={cn('text-figure', className)} {...rest}>
      {compact ? formatINRCompact(amount) : formatINR(amount)}
    </span>
  );
}
```

🔴 `ref` is an ordinary prop in React 19, so don't use `forwardRef` in new code.
🔴 **Prop drilling limit:** if a prop passes through more than 2 components that don't use it, use composition (`children` or slots) first, then Context.
🟡 Use one `variant` union instead of several booleans.
🟡 Keep props flat. Pass what the component needs, not whole objects "just in case".
⛔ Avoid spreading unknown props onto DOM elements, and avoid render props where `children` would do.

---

## 8. Data fetching and API integration

🔴 **One typed client** (`lib/api-client.ts`) handles the base URL, credentials, JSON and error normalisation.
🔴 **Validate every response with Zod at the boundary.** Types come from the schema.

```ts
// features/events/api/events.schema.ts
export const eventSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  status: z.enum(['created', 'requested', 'planning', 'completed', 'cancelled']),
  overallBudget: z.number().int().nullable(),
});
export type Event = z.infer<typeof eventSchema>;

// features/events/api/events.keys.ts
export const eventsKeys = {
  all: ['events'] as const,
  list: (filter: EventFilter) => [...eventsKeys.all, 'list', filter] as const,
  detail: (id: string) => [...eventsKeys.all, 'detail', id] as const,
};

// features/events/api/events.api.ts
export const eventQueryOptions = (id: string) =>
  queryOptions({
    queryKey: eventsKeys.detail(id),
    queryFn: async () => eventSchema.parse(await api.get(`/events/${id}`)),
  });

// features/events/hooks/use-event.ts
export const useEvent = (id: string) => useQuery(eventQueryOptions(id));
```

🔴 After a mutation, invalidate or update the affected keys. Optimistic updates must roll back on error.
🔴 **Multi-tenancy:** the UI never sends or trusts `company_id`. The server derives it from the session.
🟡 Prefetch on route load or on hover for the screens people visit most.
⛔ Avoid `fetch` inside `useEffect`, server data in `useState`, and query keys written as inline strings.

---

## 9. Forms and validation

🔴 Build forms with React Hook Form + `zodResolver` + shadcn `Field` components. Always set `defaultValues`.

```tsx
const taskSchema = z.object({
  title: z.string().trim().min(1, 'Enter a title').max(120),
  dueDate: z.iso.date(),
  dueTime: z.string().optional(),
  remindBeforeMin: z.number().int().min(0).default(15),
});
type TaskForm = z.infer<typeof taskSchema>;

const form = useForm<TaskForm>({
  resolver: zodResolver(taskSchema),
  defaultValues: { title: '', dueDate: today, remindBeforeMin: 15 },
});
```

🔴 Every input has a visible label (a placeholder isn't a label), errors are linked with `aria-describedby`, and the first invalid field gets focus on submit.
🔴 The submit button shows a pending state and prevents a double submit.
🟡 Share the Zod schema with the server when both use TypeScript.
⛔ Avoid validating only on the client, and clearing the user's input after a server error.

---

## 10. Routing

🔴 Use React Router with route modules split by feature and lazy loaded:

```tsx
{ path: 'events/:eventId/plan', lazy: () => import('@/features/plan/routes/plan-route') }
```

🔴 Each route segment has an error element and a loading state (skeleton).
🔴 Shareable state (tabs, filters, the selected function) lives in search params, so a link reproduces the screen.
🟡 Gate authenticated routes in one layout route, not in every page.

---

## 11. Error handling

🔴 Put error boundaries (`react-error-boundary`) at the route level and around risky widgets. Show a calm message and a retry option.
🔴 Never swallow errors. Show the user what happened and what to do next ("Couldn't save. Check your connection and try again.").
🔴 Never show raw exception text or stack traces to users.
🟡 Report errors centrally (for example with Sentry) with no personal data in the payload.

---

## 12. Type safety

🔴 Turn on `"strict": true`, `"noUncheckedIndexedAccess": true`, `"noImplicitOverride": true` and `"exactOptionalPropertyTypes": true` in `tsconfig.app.json`.
🔴 No `any`. Use `unknown` and narrow it. No `@ts-ignore`; use `@ts-expect-error` with a reason only in tests.
🔴 No non-null `!` without a comment saying why.
🟡 Use `satisfies` for config objects, discriminated unions for state, and branded types for ids when they get mixed up (`EventId`, `TaskId`).

---

## 13. Performance

🔴 Use stable, unique `key`s (data ids).
🔴 Split code by route with `lazy`. Load heavy libraries (xlsx, charts) with dynamic `import()` when they're needed.
🟡 Turn on the React Compiler and check the "Memo ✨" badges in React DevTools.
🟡 Use `useTransition` or `useDeferredValue` for heavy filters and switches.
🟢 Virtualise lists over about 200 rows (TanStack Virtual), for example the rooms table.
🟢 Set budgets: plan screens load in under 2s for 10 functions and 80 service lines; LCP under 2.5s and INP under 200ms.

---

## 14. Accessibility (WCAG 2.2 AA)

🔴 Use semantic HTML before ARIA: `<button>` for actions, `<a>` for navigation, and real `<table>` markup for data.
🔴 Everything can be done with the keyboard, focus is always visible (2px gold ring), and nothing traps focus except modals.
🔴 Text contrast is 4.5:1 or better (the tokens are pre-checked). Status is never shown by colour alone.
🔴 Targets are at least 24×24px on web and 48px on mobile.
🔴 Sticky headers and footers never cover the focused element (`scroll-padding`).
🟡 Run `eslint-plugin-jsx-a11y` in lint and axe checks in tests.

---

## 15. Security

🔴 No `dangerouslySetInnerHTML` unless the content is sanitised with DOMPurify.
🔴 No secrets in the frontend. Only `VITE_*` variables reach the browser, and they are public. Read env through `lib/env.ts` (Zod-validated).
🔴 Authorisation is checked on the server. Hiding a button is not security.
🔴 Reject `javascript:` URLs in user-supplied links (portfolio links, websites).
🔴 Don't log personal data (names, phones) to the console or to analytics.
🟡 Configure a Content Security Policy at hosting. Run `npm audit` in CI and use Renovate or Dependabot for updates.

---

## 16. Environment configuration

🔴 Commit `.env.example` and never commit `.env*.local`.
🔴 Every variable is declared and validated in `lib/env.ts`, so the app fails fast at startup.
🟡 Use one build per environment (development, staging, production) through `VITE_APP_ENV`.

---

## 17. Testing strategy

| Level      | Tool                            | What                                                                            |
| ---------- | ------------------------------- | ------------------------------------------------------------------------------- |
| Unit       | Vitest                          | Pure functions: budget roll-ups, task date rule, formatters                     |
| Component  | Vitest + RTL + user-event + MSW | Screens and components as a user sees them                                      |
| End-to-end | Playwright                      | Critical flows: create event → submit form → add service → add task → mark done |

🔴 Query by role first: `getByRole` → `getByLabelText` → `getByText` → `getByTestId`.
🔴 Every calculation rule has unit tests, including edge cases (no budget, Shared lines, over envelope).
🔴 Mock the network with MSW, not modules.
⛔ Avoid whole-component snapshots and `waitFor` with arbitrary sleeps.

```tsx
test('marks a task done and offers undo', async () => {
  const user = userEvent.setup();
  render(<TodayScreen />);
  await user.click(await screen.findByRole('button', { name: /done: dj sound check/i }));
  expect(screen.getByRole('button', { name: /undo/i })).toBeInTheDocument();
});
```

---

## 18. Linting, formatting and validation

🔴 **Use ESLint 9 flat config** (`eslint.config.js`): `typescript-eslint` strictTypeChecked, `react-hooks` recommended (including the compiler rules), `react-refresh`, `jsx-a11y`, and `eslint-comments` with `require-description`.
🔴 Prettier owns formatting, so there are no style debates in review.
🔴 **CI runs, in order:** `npm ci` → `typecheck` → `lint --max-warnings 0` → `format:check` → `test` → `build`. Any failure blocks the merge.
🔴 Every `eslint-disable` comment includes a reason:

```ts
// eslint-disable-next-line @typescript-eslint/no-floating-promises -- fire-and-forget analytics ping
```

🟡 Pre-commit checks with husky + lint-staged (`eslint --fix` and `prettier --write` on staged files).

---

## 19. Build and deployment quality

🔴 Pin the Node LTS version (`.nvmrc` and `engines` in package.json). Install from the lockfile (`npm ci`).
🔴 Production builds have source maps uploaded to error tracking but not served publicly.
🟡 Each PR gets a preview deployment. Check bundle size on PRs (fail when it grows more than 10%).
🟡 Keep dependencies current with Renovate on a weekly batch.

---

## 20. Code review checklist

Copy this into your PR template. Every item should be true, or have a written reason.

**Architecture**

- [ ] Code is in the right feature folder, and components have a single responsibility.
- [ ] Logic is in hooks or pure functions, with no duplicated component or hook.
- [ ] There's no DI or pass-through service layer, and no unnecessary abstraction.

**State and data**

- [ ] No derived state, no mutation, and no fetching in effects.
- [ ] Effects only sync with external systems, and their deps are correct and not suppressed.
- [ ] Server data comes only from TanStack Query, with key factories and invalidation.
- [ ] Responses are parsed with Zod, and no tenant id is trusted from the UI.
- [ ] Any memoization has a `// why:` comment.

**Types and props**

- [ ] Props are typed, with no `any`, `@ts-ignore` or unexplained `!`.
- [ ] No drilling beyond 2 levels, and variant unions are used instead of boolean props.

**UI and design**

- [ ] Tokens only (no inline styles or hex), with `cn()` and `cva` for variants.
- [ ] shadcn primitives are reused, and there's one primary action per view.
- [ ] Gold is used only for selection, progress, links and focus.
- [ ] Loading, empty, error and success states are present.
- [ ] Mobile targets are 48px, and money and dates use the formatters.

**Accessibility**

- [ ] Semantic elements, labelled inputs, and errors linked to their fields.
- [ ] Visible focus, and status never shown by colour alone.

**Quality**

- [ ] Typecheck, lint and tests pass, and new rules or calculations have tests.
- [ ] No dead code, `console.log` or unexplained `eslint-disable`.
- [ ] No secrets, no unsanitised HTML, and no personal data in logs.

---

## References

- React rules: https://react.dev/reference/rules
- You Might Not Need an Effect: https://react.dev/learn/you-might-not-need-an-effect
- React Compiler: https://react.dev/learn/react-compiler
- Rendering lists and keys: https://react.dev/learn/rendering-lists
- TypeScript tsconfig: https://www.typescriptlang.org/tsconfig
- typescript-eslint: https://typescript-eslint.io
- eslint-plugin-react-hooks: https://www.npmjs.com/package/eslint-plugin-react-hooks
- Tailwind CSS: https://tailwindcss.com/docs
- shadcn/ui: https://ui.shadcn.com/docs
- TanStack Query: https://tanstack.com/query/latest
- React Hook Form: https://react-hook-form.com
- Zod: https://zod.dev
- React Router: https://reactrouter.com
- Testing Library queries: https://testing-library.com/docs/queries/about
- Vitest: https://vitest.dev
- Playwright: https://playwright.dev
- WCAG 2.2: https://www.w3.org/WAI/WCAG22/quickref
- OWASP Cheat Sheets: https://cheatsheetseries.owasp.org

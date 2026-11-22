---
paths:
  - 'src/**/*.{ts,tsx}'
---

# Hooks and state rules

- `const [x, setX] = useState(...)`; never mutate — `setItems((prev) => [...prev, item])`.
- Derive during render; never store derived state.
  ```tsx
  // ✗ useEffect(() => setFullName(`${first} ${last}`), [first, last]);
  // ✓ const fullName = `${first} ${last}`;
  ```
- `useEffect` only for external systems (subscriptions, timers, browser APIs, non-React widgets). User actions go in event handlers. Data fetching goes through TanStack Query, never a raw effect.
- Reset state on identity change with `key={id}`, not an effect.
- Never silence `react-hooks/exhaustive-deps`; restructure, or use `useEffectEvent` for non-reactive logic.
- Related flags → discriminated union or `useReducer` (no `isLoading` + `isError` + `isSuccess` trio).
- React Compiler is on: no `useMemo`/`useCallback`/`memo` by default. If you need one (third-party ref equality, measured hot path), add `// why:` comment.
- Global client state: Context for low-frequency values (theme, session). Zustand only for complex, frequently-updated UI state shared across distant components. Server state is never in either.
- Custom hooks start with `use`, return an object (not a long tuple), and do one thing.

---
paths:
  - '**/*.test.{ts,tsx}'
  - 'e2e/**'
  - 'src/test/**'
---

# Testing rules

- Stack: Vitest + React Testing Library + `@testing-library/user-event` + MSW; Playwright for e2e.
- Test behaviour, not implementation. Query priority: `getByRole` → `getByLabelText` → `getByText` → `getByTestId` (last resort).
- `const user = userEvent.setup()` before render; `await` every interaction; `findBy*` for async.
- Mock the network with MSW handlers, not modules.
- Every calculation rule (budget roll-ups, task date rule) has unit tests with edge cases (0, Shared lines, over envelope).
- No whole-component snapshots. No `waitFor` with arbitrary timeouts.
- Coverage is advisory (aim 80% for hooks/lib), not a gate.

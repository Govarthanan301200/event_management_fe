---
paths:
  - 'src/features/**/api/**'
  - 'src/lib/api-client.ts'
  - 'src/**/*form*.tsx'
  - 'src/**/use-*.ts'
---

# API and form rules

- One typed client in `src/lib/api-client.ts`. Feature calls live in `features/<f>/api/<f>.api.ts`; schemas in `<f>.schema.ts`.
- Parse every response with Zod at the boundary; types come from `z.infer`.
- TanStack Query: query key factory per feature (`ordersKeys.list(status)`), `queryOptions()` helpers, `useMutation` + `invalidateQueries` on success. Optimistic updates only with rollback.
- Never copy query data into `useState`; never fetch in `useEffect`.
- Every record is tenant-scoped: never send or trust a `company_id` from the client UI; the server derives it from the session.
- Forms: React Hook Form + `zodResolver` + shadcn `Field`; always `defaultValues`; same Zod schema reused for server validation where shared.
- Every input has a visible label; errors linked via `aria-describedby`; submit button shows pending state and is not double-submittable.
- Env: only `VITE_*` reach the browser and are public. Read env through `src/lib/env.ts` (Zod-validated). No secrets in the frontend.
- Never render HTML from data with `dangerouslySetInnerHTML` unless sanitized with DOMPurify.

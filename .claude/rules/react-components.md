---
paths:
  - 'src/**/*.tsx'
---

# Component rules

- One responsibility per component. Split when a file mixes data fetching, form state and complex layout, or passes ~200 lines.
- Pattern: `useX()` hook owns data and decisions → component renders. Keep JSX free of business rules.
- Props: `type XProps = {...}`; wrappers around native elements extend `React.ComponentProps<'button'>` and spread `...rest`. `ref` is a normal prop (React 19) — no `forwardRef`.
- Prefer one `variant` union over several booleans (`isPrimary`, `isDanger` ✗).
- Prop drilling through more than 2 components that don't use the prop → use `children`/slots first, then Context (split contexts by update frequency).
- Never define a component inside another component.
- Keys: stable data ids, never array index for lists that change.
- Early returns for loading / error / empty; no nested ternaries in JSX.
- Named exports; file kebab-case; component PascalCase.
- Never edit `src/components/ui/*`; wrap in `src/components/shared/`.

```tsx
// ✅
export function OrderList({ status }: OrderListProps) {
  const { data, isPending, error } = useOrders(status);
  if (isPending) return <OrderListSkeleton />;
  if (error) return <ErrorState error={error} />;
  if (data.length === 0) return <EmptyState title="Add your first order" />;
  return (
    <ul>
      {data.map((o) => (
        <OrderRow key={o.id} order={o} />
      ))}
    </ul>
  );
}
```

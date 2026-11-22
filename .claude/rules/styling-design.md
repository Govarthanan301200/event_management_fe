---
paths:
  - 'src/**/*.{tsx,css}'
---

# Styling rules (design system: Ink & Antique gold)

- Tailwind classes bound to theme tokens only (`bg-background`, `text-muted-foreground`, `bg-gold-soft`, `text-danger`). No hex, no `style={{}}`.
- Exception: a runtime value via CSS variable: `style={{ '--pct': `${pct}%` } as React.CSSProperties}` + `className="w-(--pct)"`.
- Merge with `cn()`; variants with `cva`. Mobile-first (`sm:` `md:` `lg:`). Spacing from the 4px scale; no arbitrary values without a reason.
- `primary` (ink) = actions, one primary button per view. `gold` = selection, active indicator, progress, links, focus only — never a button fill or status.
- Status = colour + word/icon: success (teal), warning (marigold) for "edited/changed", danger (crimson) + ⚠ for over/overdue/issue.
- Fonts: `font-display` (Fraunces) only for event names, S1 hero, function/vendor titles. Everything else `font-sans`. Figures use `tabular-nums` and are right-aligned.
- Money via `formatINR()`; full figures in tables, "L" short form only in compact widgets.
- Mobile tap targets `h-12` (48px); web min 24px.
- Borders for resting surfaces; `shadow-overlay` only on drawers, dialogs, popovers, toasts.
- For any new screen or visual decision, use the `ui-ux-designer` skill (reads `docs/design-system/README.md`).

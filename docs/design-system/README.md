**Ink & Antique gold.** A black-tie invitation turned into a working tool. Warm ivory paper, deep ink type, and one thread of antique gold that marks what is selected, active or special. Calm enough for an 80-row budget table and refined enough to send to a bride.

## Principles

1. **The invitation, not the decoration.** Premium comes from restraint: generous space, fine hairlines, confident type. No florals, mandala patterns, paisley, gradients or glitter. The wedding provides the colour; the tool stays composed.
2. **Ink acts, gold marks.** `primary` (ink) is for actions. `gold` is for state and signature: what is selected, current, in progress, or the brand moment. Gold is never a button fill and never a status.
3. **Money is the hero of planning.** Figures are large, tabular, right-aligned and in Indian grouping. Every total is one click from its parts.
4. **Calm on the day.** S12 (Today) is used while walking, in sunlight, under pressure. It has the largest targets, the fewest words and the strongest contrast in the product.
5. **One screen, one job.** Each screen has one primary action; everything else is secondary, ghost or in a ⋯ menu.

## Voice and content

- Write in sentence case everywhere: "Add service", "Send to planner", "Plan by category".
- Speak to the planner as "you"; the app never says "I". Confirmations are past tense: "Saved", "Task moved to 13 Feb".
- Buttons are a verb plus a noun, 1–3 words: "Add function", "Lock form", "Shift tasks". Never "Submit" or "OK".
- Errors say what happened and what to do: "That phone number is already saved for Vendor H. Open their profile?"
- Empty states invite: "Add your first function" with one sentence of help, not "No data".
- The client form (S1) is warmer and slower: "Tick what you'd like us to arrange. Add a note if something matters to you."
- Use wedding vocabulary as the spec does (Muhurtham, Sangeet, Nalangu). Never translate function names.
- No emoji in the UI. No exclamation marks except the client thank-you page ("Thank you! Your planner has your list.").

## Colour

- Page ground is `surface`; content sits on `surface-raised` cards and tables; chrome (sidebar, table headers, category bands) is `surface-sunken`. Three planes only.
- Body text is `ink`; secondary text is `ink-muted`. Use `ink-subtle` only for icons, placeholders and disabled states.
- The primary action is `primary` with `on-primary` text. In dark theme it inverts to an ivory button with ink text: this is intentional and is the most "black-tie" moment of the dark UI.
- `gold` appears as **lines and small marks**: the 2px indicator under the selected tab, the 3px bar beside the active nav item, the border of the active function chip, progress fills, links, the 1px hairline under the event header, and the S1 monogram. Keep gold under ~5% of any screen.
- `gold-soft` is the selected or "today" fill (selected table row, ticked service on S1, current function).
- Status always pairs a colour with a word or icon: `success` + check for Done and Planned; `warning` word tags for "edited" and "changed"; `danger` + ⚠ for over budget, Overdue and Issue. Status tags use the `-soft` fill with the strong colour as text.
- Over-envelope amounts are `danger` text with "₹50,000 over"; never colour the whole row red.
- Dividers are `border` at 1px. Control edges are `border-control`. Focus is a 2px `focus-ring` outline at 2px offset; never remove it.

## Typography

- Two families. `display` (Fraunces) for names and moments; `sans` (Anek Latin) for the interface. Load both from Google Fonts: Fraunces with `opsz` and `wght` axes, `SOFT` 30 and `WONK` 0 (the elegant cut); Anek Latin with `wght`.
- Use the display face only for: the event name (`headline`), the S1 hero (`display`), function names in By-function view, vendor names on profiles and drawer titles (`title-serif`), and the dashboard greeting. Never for buttons, labels, tables or numbers.
- Everything else is `sans`: `body` on web, `body-touch` on mobile and in every mobile input, `body-strong` for service names and task titles, `label` for chips, tabs and column headers, `caption` for timestamps, `overline` for category bands and task group headers.
- All figures use `figure` or `figure-lg` with `font-variant-numeric: tabular-nums lining-nums`. Before shipping, confirm Anek Latin's `tnum` feature in your browser; if it is missing, set figures in `system-ui` with tabular-nums rather than let columns wobble.
- Tamil (later): Anek Tamil is the companion to Anek Latin and Noto Serif Tamil sits behind Fraunces in the stacks, so Tamil strings need no new decisions.
- Never set text below 12px, never use all caps except `overline`, and never use more than three sizes in one card.

## Money, dates and numbers

- Format rupees with `Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })`: ₹1,80,000 and ₹12,00,000.
- Use the short "L" form (₹18.2L) only in compact widgets: dashboard rows and mobile cards. Tables and drawers always show the full figure.
- Right-align every amount column. Totals rows are `body-strong` on `surface-sunken` with a 1px `border` above.
- Dates read "14 Feb 2027"; within the current year, drop the year ("14 Feb"). Times follow the company setting; default 12-hour ("6:30 PM").
- Quantities carry their unit in `ink-muted`: "400 pax", "5 hrs", "40 × 20 ft".
- Pax pre-filled from guests shows "(guests)" in `ink-muted`; an edited value shows a `warning` tag "edited".

## Layout and spacing

Spacing is a 4px grid: `space-1` … `space-16`. Radii are `radius-sm` (controls), `radius-md` (cards), `radius-lg` (drawers, sheets) and `radius-pill` (chips, progress).

**Planner web shell.** A left sidebar (`sidebar-width`, `surface-sunken`) holds Dashboard, Events, Vendors, Inventory and Settings. The active item gets `gold-soft` fill and a 3px `gold` bar. Content sits on `surface` with a `space-8` gutter, capped at `content-max` (tables may run full width). The sidebar collapses to icons below 1024px.

**Event workspace.** The header shows the event name in `headline`, the client and budget in `ink-muted`, a status badge, and the tabs Overview · Plan by category · By function · Summary · Tasks. Below the tabs is a 1px `gold` hairline: the one ornamental line in the product. The function strip ("Mehendi 150 · Sangeet 400 · …") stays sticky under the tabs on S7 and S9.

**Plan by category (S7).** Each category is a `surface-sunken` band in `overline` with its envelope meter on the right (planned of envelope, `gold` fill, turning `danger` with "over"). Service lines are collapsible `surface-raised` rows at `row-height`; expanded rows reveal the function sub-table. Amounts are right-aligned in `figure`.

**Service drawer (S8).** Slides from the right at `drawer-width`, `radius-lg` on its leading corners, `shadow-overlay`, title in `title-serif`. Fields stack in the spec's order. The footer is sticky with Cancel (ghost) and Save service (primary). The rate suggestion is a `gold-soft` inline note with a "Use" text button; it never fills the field by itself.

**Summary (S10).** Four headline cards (Budget, Planned, Left, Over) in `figure-lg`, then the category × function grid. Sticky first column and header; Shared and Total columns sit on `surface-sunken`; envelope breaches show the ⚠ and `danger` figure. Below 1024px the grid becomes category cards with a meter each.

**Mobile Today (S12).** Single column, `space-4` gutters, `body-touch` everywhere, controls at `control-lg`. The header carries the function name in `headline`, venue and time, and a full-width `radius-pill` progress bar in `gold`. Groups follow the spec: Overdue (`danger-soft` band), Next up, Later, Anytime today, Done (collapsed). Each task card puts Call and Issue as outline buttons and Done as the primary button on the right, within thumb reach. The bottom tab bar has three tabs, with the active tab marked by a `gold` dot and an ink label. In bright sunlight, offer a high-contrast toggle that lifts `ink-muted` to `ink` and doubles border weights.

**Client form (S1).** The brand moment. Centred column at `form-max` on `surface`. The planner company's logo, or its initials as a gold monogram, sits above a `display` headline. Categories are collapsible with an `overline` header and a "2 selected" count. Each service is a `surface-raised` card with `radius-lg`; ticking it turns it `gold-soft` with a gold check and reveals the note field. A sticky bottom bar on `surface-raised` with `shadow-sticky` holds the selected total and Send to planner (primary, `control-lg`). A short privacy line in `caption` sits above the button.

**Rooms and guests (S14).** A spreadsheet surface: dense `row-height` rows, `label`-size headers on `surface-sunken`, zebra striping off, `gold-soft` for the selected row and a 2px `gold` outline for the active cell.

## Components and patterns

Build on shadcn/ui; restyle through tokens, not per-component overrides.

- **Buttons:** primary (`primary` fill), secondary (outline in `border-control`, `ink` text), ghost (no edge, `surface-sunken` on hover), destructive (`danger` text on hover-fill `danger-soft`; confirm in a dialog). Heights are `control-sm`, `control-md` and `control-lg`, with radius `radius-sm`.
- **Chips:** function and filter chips are `radius-pill` with `label` text. Resting chips are outline with `ink-muted` text. Active chips have a `gold` 1.5px border, `gold-soft` fill and `ink` text.
- **Tabs:** `label` in `ink-muted`; the selected tab is `ink` with a 2px `gold` underline.
- **Badges and tags:** `radius-sm`, `caption` weight 500, `-soft` fill and strong-colour text. Event status badges are neutral (`surface-sunken` and `ink-muted`) except Cancelled, which uses `danger`.
- **Tables:** no vertical rules. Use a 1px `border` between rows, `surface-sunken` header, `label` headers in `ink-muted` and right-aligned figures. Hover is `surface-sunken` and selection is `gold-soft`.
- **Toasts:** bottom-centre on mobile and bottom-right on web, `surface-raised` with `shadow-overlay`, one line plus an Undo action. Undo after Done lasts 5 seconds.
- **Empty states:** a `title-serif` line, one `body` sentence in `ink-muted` and one primary or secondary action. Leave out the illustration, or use a single fine-line ink drawing.
- **Skeletons:** `surface-sunken` blocks with a slow 1.6s shimmer; never spinners for page loads.
- **Offline (mobile):** a slim `surface-sunken` bar reading "Offline · changes will sync". Never block actions.

## Motion

- Motion should feel like paper settling, not bouncing. Use 120ms for hover and press, 200ms for chips, tabs and toggles, and 280ms for drawers and sheets. Use `cubic-bezier(0.2, 0, 0, 1)` for entering and `cubic-bezier(0.4, 0, 1, 1)` for leaving.
- Tab and nav indicators slide; they don't fade.
- Done on mobile: a 160ms check stroke draw, a light haptic tap, then the card collapses into the Done group after 400ms.
- Use React `<ViewTransition>` for switching functions and tabs, as a cross-fade only.
- Respect `prefers-reduced-motion`: replace slides with fades and drop the shimmer.

## Iconography

- Use Lucide icons (shadcn's default) at a 1.5px stroke: 16px in tables and chips, 20px in buttons and nav, 24px on mobile actions.
- Icons are `ink-muted` at rest and `ink` when active; use `danger` only beside a danger word.
- There's no emoji, and no filled or duotone icons.
- The product has no logo yet. Set the product name in `title-serif`. On S1, show the planner company's own logo, or its initials in `gold` Fraunces as a monogram.

## Accessibility

- Target WCAG 2.2 AA. Every text pair named in a token's usage note passes 4.5:1 in both themes, and control edges and the focus ring pass 3:1.
- Pointer targets are at least 24×24px on web and `control-lg` (48px) on mobile.
- Sticky headers and footers must never cover the focused element: add `scroll-padding` equal to their height.
- Status is never colour alone: every badge has a word, and every danger has ⚠.
- Every input has a visible label (not just a placeholder), and errors are linked with `aria-describedby`.

## Mapping to shadcn/ui and Tailwind v4

Set these shadcn variables from the tokens in `globals.css`:

| shadcn variable                          | token                                  |
| ---------------------------------------- | -------------------------------------- |
| `--background`                           | `surface`                              |
| `--foreground`                           | `ink`                                  |
| `--card`, `--popover`                    | `surface-raised`                       |
| `--muted`, `--sidebar`                   | `surface-sunken`                       |
| `--muted-foreground`                     | `ink-muted`                            |
| `--primary` / `--primary-foreground`     | `primary` / `on-primary`               |
| `--secondary` / `--secondary-foreground` | `gold-soft` / `ink`                    |
| `--accent` / `--accent-foreground`       | `surface-sunken` / `ink` (hover fills) |
| `--destructive`                          | `danger`                               |
| `--border`                               | `border`                               |
| `--input`                                | `border-control`                       |
| `--ring`                                 | `focus-ring`                           |
| `--radius`                               | `radius-md`                            |

Add custom Tailwind theme colours for `gold`, `gold-soft`, `success`, `warning`, `danger` and their `-soft` pairs, so classes read `bg-gold-soft`, `text-danger` and so on. Never hard-code a hex in a component.

## Don't

- Use gold as a button, a big fill, a gradient or a status colour.
- Use pure black (#000) or pure white page backgrounds.
- Add drop shadows to resting cards; use borders instead.
- Use more than one primary button per view.
- Put the serif in tables, numbers or buttons.
- Use wedding clip-art, florals, mandalas or confetti in the product UI.
- Colour a whole row or card red; mark only the figure and its word.

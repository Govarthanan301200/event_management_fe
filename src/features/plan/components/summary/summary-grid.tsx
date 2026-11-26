import type { EventMoneySummary } from '@/features/summary';
import { formatDay, formatGrouped, formatINR } from '@/lib/format';
import { cn } from '@/lib/utils';
import { CellLink, Dash, stickyFirst, sunken } from './grid-cells';
import { GridRow } from './grid-row';

type SummaryGridProps = { eventId: string; summary: EventMoneySummary };

const head = 'sticky top-0 z-10 text-label font-medium text-muted-foreground';

/**
 * S10 category × function grid (spec §12) at 1024px and up. A plain table rather than the shadcn
 * Table: its own overflow wrapper would become the scroll container and break the sticky header
 * and first column, which must both scroll inside this one box.
 */
export function SummaryGrid({ eventId, summary }: SummaryGridProps) {
  const { functions, categories } = summary;
  const overall = summary.left !== null && summary.left < 0;
  return (
    // why the arbitrary height: header and first column stick within this box, which stops short
    // of the viewport bottom so its horizontal scrollbar stays in view.
    <div className="max-h-[calc(100dvh-14rem)] overflow-auto rounded-md border border-border">
      <table className="w-full border-separate border-spacing-0">
        <caption className="sr-only">Planned amounts by category and function, in rupees</caption>
        <thead>
          <tr>
            <th scope="col" className={cn(head, stickyFirst, 'z-20 bg-muted px-3 py-2')}>
              Category
            </th>
            {functions.map((fn) => (
              <th key={fn.id} scope="col" className={cn(head, 'bg-muted text-right')}>
                <CellLink
                  to={`/events/${eventId}/by-function?fn=${fn.id}`}
                  label={`${fn.name}, ${formatDay(fn.date)}: open by function`}
                  className="whitespace-nowrap"
                >
                  <span className="block text-foreground">{fn.name}</span>
                  <span className="block text-caption">{formatDay(fn.date)}</span>
                </CellLink>
              </th>
            ))}
            <th scope="col" className={cn(head, 'bg-muted px-3 py-2 text-right')}>
              Shared
            </th>
            <th scope="col" className={cn(head, 'bg-muted px-3 py-2 text-right')}>
              Total
            </th>
            <th scope="col" className={cn(head, 'bg-muted px-3 py-2 text-right')}>
              Envelope
            </th>
          </tr>
        </thead>
        <tbody>
          {categories.map((category) => (
            <GridRow
              key={category.id}
              eventId={eventId}
              category={category}
              functions={functions}
            />
          ))}
        </tbody>
        <tfoot>
          <tr className="text-body font-semibold">
            <th scope="row" className={cn(stickyFirst, sunken, 'border-t px-3 py-2')}>
              Total
            </th>
            {functions.map((fn) => (
              <td key={fn.id} className={cn(sunken, 'border-t border-border text-right')}>
                <CellLink
                  to={`/events/${eventId}/by-function?fn=${fn.id}`}
                  label={`${fn.name} total: ${formatINR(fn.total)}`}
                  className="tabular-nums"
                >
                  {formatGrouped(fn.total)}
                </CellLink>
              </td>
            ))}
            <td className={cn(sunken, 'border-t border-border px-3 py-2 text-right tabular-nums')}>
              {summary.shared === 0 ? <Dash /> : formatGrouped(summary.shared)}
            </td>
            <td
              className={cn(
                sunken,
                'border-t border-border px-3 py-2 text-right whitespace-nowrap tabular-nums',
                overall && 'text-danger',
              )}
              title={overall ? `${formatINR(-(summary.left ?? 0))} over the budget` : undefined}
            >
              {overall ? '⚠ ' : ''}
              {formatGrouped(summary.planned)}
              {overall ? (
                <span className="sr-only">, {formatINR(-(summary.left ?? 0))} over the budget</span>
              ) : null}
            </td>
            <td className={cn(sunken, 'border-t border-border px-3 py-2 text-right tabular-nums')}>
              {summary.envelopeTotal === null ? <Dash /> : formatGrouped(summary.envelopeTotal)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

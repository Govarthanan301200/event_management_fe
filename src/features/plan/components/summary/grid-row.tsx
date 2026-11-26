import { Meter } from '@/components/shared/meter';
import type { CategoryRollup, SummaryFunction } from '@/features/summary';
import { formatGrouped, formatINR } from '@/lib/format';
import { cn } from '@/lib/utils';
import { CellLink, Dash, stickyFirst, sunken } from './grid-cells';

type GridRowProps = {
  eventId: string;
  category: CategoryRollup;
  functions: readonly SummaryFunction[];
};

/**
 * One S10 category row: a cell per function (opens S9 at this category), then Shared, Total and
 * Envelope (open S7 at the band). A breach marks the Total with ⚠ in danger, never the whole row.
 */
export function GridRow({ eventId, category, functions }: GridRowProps) {
  const band = `/events/${eventId}/plan#band-${category.id}`;
  const over = category.left !== null && category.left < 0;
  return (
    <tr className="group *:border-t *:border-border">
      <th scope="row" className={cn(stickyFirst, 'bg-card font-normal group-hover:bg-accent')}>
        <CellLink to={band} className="text-body font-semibold whitespace-nowrap">
          {category.name}
        </CellLink>
      </th>
      {functions.map((fn) => {
        const amount = category.byFunction[fn.id];
        return (
          <td key={fn.id} className="bg-card text-right text-figure group-hover:bg-accent">
            {amount === undefined ? (
              <span className="block px-3 py-2">
                <Dash />
              </span>
            ) : (
              <CellLink
                to={`/events/${eventId}/by-function?fn=${fn.id}#fn-cat-${category.id}`}
                label={`${category.name} at ${fn.name}: ${formatINR(amount)}`}
              >
                {formatGrouped(amount)}
              </CellLink>
            )}
          </td>
        );
      })}
      <td className={cn(sunken, 'text-right text-figure')}>
        <CellLink to={band}>
          {category.shared === 0 ? <Dash /> : formatGrouped(category.shared)}
        </CellLink>
      </td>
      <td className={cn(sunken, 'text-right text-figure', over && 'text-danger')}>
        <CellLink
          to={band}
          label={
            over
              ? `${category.name} total ${formatINR(category.planned)}, ${formatINR(-(category.left ?? 0))} over envelope`
              : undefined
          }
          className="whitespace-nowrap"
        >
          <span title={over ? `${formatINR(-(category.left ?? 0))} over` : undefined}>
            {over ? '⚠ ' : ''}
            {formatGrouped(category.planned)}
          </span>
        </CellLink>
      </td>
      <td className={cn(sunken, 'text-right text-figure')}>
        <CellLink to={band}>
          {category.envelope === null ? (
            <Dash />
          ) : (
            <span className="flex flex-col items-end gap-1">
              {formatGrouped(category.envelope)}
              <Meter value={category.planned} max={category.envelope} className="w-14" />
            </span>
          )}
        </CellLink>
      </td>
    </tr>
  );
}

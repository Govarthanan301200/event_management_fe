import { DragHandle } from '@/components/shared/drag-handle';
import { RowMenu, type RowMenuItem } from '@/components/shared/row-menu';
import { TableCell, TableRow } from '@/components/ui/table';
import { useSortableRow } from '@/hooks/use-sortable-row';
import { formatDay, formatTimeRange } from '@/lib/format';
import type { EventFunction } from '../api/events.schema';

type FunctionRowProps = {
  fn: EventFunction;
  /** Edit, Move up / down, Delete. */
  actions: RowMenuItem[];
};

const guests = new Intl.NumberFormat('en-IN');

/** One S6 function. Below 640px, time and venue fold under the name. */
export function FunctionRow({ fn, actions }: FunctionRowProps) {
  const { attachRow, attachHandle, handleProps, style, className, isDragging } = useSortableRow(
    fn.id,
  );
  const time = formatTimeRange(fn.startTime, fn.endTime);
  const venue = fn.venueName ?? '—';

  return (
    <TableRow ref={attachRow} style={style} data-dragging={isDragging} className={className}>
      <TableCell className="w-8 pr-0">
        <DragHandle label={`Reorder ${fn.name}`} ref={attachHandle} {...handleProps} />
      </TableCell>
      <TableCell className="max-w-0 whitespace-normal">
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-body font-semibold" title={fn.name}>
            {fn.name}
            {fn.functionTypeArchived ? (
              <span className="font-normal text-muted-foreground"> (archived type)</span>
            ) : null}
          </span>
          <span className="text-caption text-muted-foreground sm:hidden">
            {formatDay(fn.date)} · {time}
          </span>
          <span className="truncate text-caption text-muted-foreground lg:hidden" title={venue}>
            {fn.venueName ?? 'No venue yet'}
          </span>
        </div>
      </TableCell>
      <TableCell className="hidden w-28 text-label tabular-nums sm:table-cell">
        {formatDay(fn.date)}
      </TableCell>
      <TableCell className="hidden w-48 text-label tabular-nums sm:table-cell">{time}</TableCell>
      <TableCell className="hidden max-w-0 truncate text-label lg:table-cell" title={venue}>
        {venue}
      </TableCell>
      <TableCell className="w-24 text-right text-label tabular-nums">
        {guests.format(fn.guestCount)}
        <span className="text-muted-foreground"> pax</span>
      </TableCell>
      <TableCell className="w-10">
        <RowMenu label={`Actions for ${fn.name}`} items={actions} />
      </TableCell>
    </TableRow>
  );
}

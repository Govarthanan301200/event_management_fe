import type { EventFunction } from '@/features/events';
import { formatDay, formatINR, formatTimeRange } from '@/lib/format';

type FunctionHeaderProps = { fn: EventFunction; total: number };

const guests = new Intl.NumberFormat('en-IN');

/** S9 header: the function in the display face, when and for how many, and its total (spec §12). */
export function FunctionHeader({ fn, total }: FunctionHeaderProps) {
  const details = [
    formatDay(fn.date),
    formatTimeRange(fn.startTime, fn.endTime),
    fn.venueName,
    `${guests.format(fn.guestCount)} guests`,
  ].filter(Boolean);
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
      <div className="flex min-w-0 flex-col gap-1">
        <h2 className="text-title-serif">{fn.name}</h2>
        <p className="text-label text-muted-foreground">{details.join(' · ')}</p>
      </div>
      <p className="flex flex-col items-end">
        <span className="text-label text-muted-foreground">{fn.name} total</span>
        <span className="text-figure-lg">{formatINR(total)}</span>
      </p>
    </header>
  );
}

import { Meter } from '@/components/shared/meter';
import { formatINR } from '@/lib/format';
import { cn } from '@/lib/utils';

type EnvelopeSummaryProps = { envelope: number | null; planned: number; left: number | null };

/**
 * S7 category header money: "Envelope ₹12,00,000 · Planned ₹11,10,000 · ₹90,000 left", with a meter
 * that fills gold and turns danger with ⚠ and "over" (design system: Plan by category). The
 * figures are the server's spec §12 roll-up.
 */
export function EnvelopeSummary({ envelope, planned, left }: EnvelopeSummaryProps) {
  if (envelope === null || left === null) {
    return (
      <p className="text-label text-muted-foreground">
        Planned <span className="text-foreground tabular-nums">{formatINR(planned)}</span> · No
        envelope
      </p>
    );
  }
  const over = left < 0;
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <p className="text-label text-muted-foreground">
        Envelope <span className="text-foreground tabular-nums">{formatINR(envelope)}</span> ·
        Planned <span className="text-foreground tabular-nums">{formatINR(planned)}</span> ·{' '}
        <span className={cn('tabular-nums', over ? 'font-medium text-danger' : 'text-foreground')}>
          {over ? `⚠ ${formatINR(-left)} over` : `${formatINR(left)} left`}
        </span>
      </p>
      <Meter value={planned} max={envelope} className="w-24" />
    </div>
  );
}

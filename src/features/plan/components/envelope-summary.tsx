import type { CSSProperties } from 'react';
import { formatINR } from '@/lib/format';
import { cn } from '@/lib/utils';
import { envelopeStatus } from '../lib/rollup';

type EnvelopeSummaryProps = { envelope: number | null; planned: number };

/**
 * S7 category header money: "Envelope ₹12,00,000 · Planned ₹11,10,000 · ₹90,000 left", with a meter
 * that fills gold and turns danger with ⚠ and "over" (design system: Plan by category).
 */
export function EnvelopeSummary({ envelope, planned }: EnvelopeSummaryProps) {
  const status = envelopeStatus(envelope, planned);
  if (status.kind === 'none') {
    return (
      <p className="text-label text-muted-foreground">
        Planned <span className="text-foreground tabular-nums">{formatINR(planned)}</span> · No
        envelope
      </p>
    );
  }
  const over = status.kind === 'over';
  const percent = over ? 100 : Math.round(status.share * 100);
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <p className="text-label text-muted-foreground">
        Envelope <span className="text-foreground tabular-nums">{formatINR(envelope ?? 0)}</span> ·
        Planned <span className="text-foreground tabular-nums">{formatINR(planned)}</span> ·{' '}
        <span className={cn('tabular-nums', over ? 'font-medium text-danger' : 'text-foreground')}>
          {over ? `⚠ ${formatINR(status.amount)} over` : `${formatINR(status.amount)} left`}
        </span>
      </p>
      <span aria-hidden="true" className="h-1.5 w-24 overflow-hidden rounded-full bg-background">
        <span
          style={{ '--fill': `${percent}%` } as CSSProperties}
          className={cn('block h-full w-(--fill) rounded-full', over ? 'bg-danger' : 'bg-gold')}
        />
      </span>
    </div>
  );
}

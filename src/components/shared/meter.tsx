import type { CSSProperties } from 'react';
import { cn } from '@/lib/utils';

type MeterProps = {
  /** Planned amount. */
  value: number;
  /** The envelope it is measured against. */
  max: number;
  className?: string;
};

/**
 * Planned of envelope (design system: S7 band meter, S10 envelope column and mobile cards). The
 * fill and its track share a ramp (dataviz meter spec): gold on gold-soft, then danger on
 * danger-soft once over. Decorative: the figure and its "left" or "⚠ over" text sit beside it.
 */
export function Meter({ value, max, className }: MeterProps) {
  const over = value > max;
  const percent = over || max === 0 ? 100 : Math.round((Math.max(value, 0) / max) * 100);
  return (
    <span
      aria-hidden="true"
      className={cn(
        'block h-1.5 overflow-hidden rounded-full',
        over ? 'bg-danger-soft' : 'bg-gold-soft',
        className,
      )}
    >
      <span
        style={{ '--fill': `${percent}%` } as CSSProperties}
        className={cn(
          'block h-full w-(--fill) rounded-full transition-[width] duration-200 motion-reduce:transition-none',
          over ? 'bg-danger' : 'bg-gold',
        )}
      />
    </span>
  );
}

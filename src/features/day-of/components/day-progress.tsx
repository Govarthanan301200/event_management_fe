import { Meter } from '@/components/shared/meter';
import { cn } from '@/lib/utils';

type DayProgressProps = {
  done: number;
  total: number;
  /** Names the bar where several share a page (the dashboard: "Reception tasks done"). */
  label?: string;
  className?: string;
};

/**
 * Spec §14 header progress (done / total). Dataviz: one ratio against a whole is a meter, gold on
 * its gold-soft track (same ramp, contrast checked in both themes, Module 6); it can't go over, so
 * no danger state, and status colours stay out of it. The figure beside it carries the number.
 */
export function DayProgress({ done, total, label = 'Tasks done', className }: DayProgressProps) {
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={done}
      aria-valuetext={`${String(done)} of ${String(total)} done`}
      className={cn('flex items-center gap-3', className)}
    >
      <Meter value={done} max={Math.max(total, 1)} className="h-2 flex-1" />
      <span className="shrink-0 text-figure text-muted-foreground">
        <span className="text-foreground">{done}</span> of {total} done
      </span>
    </div>
  );
}

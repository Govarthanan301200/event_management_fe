import { Meter } from '@/components/shared/meter';

type DayProgressProps = { done: number; total: number };

/**
 * Spec §14 header progress (done / total). Dataviz: one ratio against a whole is a meter, gold on
 * its gold-soft track (same ramp, contrast checked in both themes, Module 6); it can't go over, so
 * no danger state, and status colours stay out of it. The figure beside it carries the number.
 */
export function DayProgress({ done, total }: DayProgressProps) {
  return (
    <div
      role="progressbar"
      aria-label="Tasks done"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={done}
      aria-valuetext={`${String(done)} of ${String(total)} done`}
      className="flex items-center gap-3"
    >
      <Meter value={done} max={Math.max(total, 1)} className="h-2 flex-1" />
      <span className="shrink-0 text-figure text-muted-foreground">
        <span className="text-foreground">{done}</span> of {total} done
      </span>
    </div>
  );
}

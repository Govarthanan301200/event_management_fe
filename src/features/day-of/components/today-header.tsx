import { Clock, Sun } from 'lucide-react';
import { ChipSwitcher } from '@/components/shared/chip-switcher';
import { Button } from '@/components/ui/button';
import { formatClock, formatDay } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useSunlight } from '../hooks/use-sunlight';
import { scopeLabel, type TodayScope } from '../lib/today';
import { DayProgress } from './day-progress';

type TodayHeaderProps = {
  today: string;
  scope: TodayScope;
  scopes: readonly TodayScope[];
  onScope: (id: string) => void;
  progress: { done: number; total: number };
  onShift: (() => void) | null;
};

/** "Sat 14 Feb" (spec §14 wireframe). */
function weekdayDate(date: string) {
  const weekday = new Intl.DateTimeFormat('en-IN', { weekday: 'short', timeZone: 'UTC' }).format(
    new Date(`${date}T00:00:00Z`),
  );
  return `${weekday} ${formatDay(date)}`;
}

/** S12 header (spec §14): function, date · start · venue, the switcher, progress, Shift tasks. */
export function TodayHeader({
  today,
  scope,
  scopes,
  onScope,
  progress,
  onShift,
}: TodayHeaderProps) {
  const sunlight = useSunlight();
  const title = scope.kind === 'function' ? scope.fn.name : 'General';
  const meta =
    scope.kind === 'function'
      ? [weekdayDate(today), formatClock(scope.fn.startTime), scope.fn.venueName]
      : [weekdayDate(today), scope.eventName];

  return (
    <header className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-headline">{title}</h1>
          <p className="text-body-touch text-muted-foreground tabular-nums">
            {meta.filter(Boolean).join(' · ')}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Sunlight mode"
          aria-pressed={sunlight.on}
          title="Sunlight mode: stronger contrast outdoors"
          className={cn('size-12 shrink-0', sunlight.on && 'bg-gold-soft text-foreground')}
          onClick={sunlight.toggle}
        >
          <Sun className="size-6" strokeWidth={1.5} aria-hidden="true" />
        </Button>
      </div>
      {scopes.length > 1 ? (
        <ChipSwitcher
          label="Today's functions"
          options={scopes.map((option) => ({ id: option.id, label: scopeLabel(option, scopes) }))}
          value={scope.id}
          onChange={onScope}
          className="-mx-4 px-4 [&>button]:h-12"
        />
      ) : null}
      {progress.total > 0 ? <DayProgress done={progress.done} total={progress.total} /> : null}
      {onShift ? (
        <Button
          variant="outline"
          className="h-12 gap-2 self-start px-4 text-body-touch sunlight:border-2"
          onClick={onShift}
        >
          <Clock className="size-6" strokeWidth={1.5} aria-hidden="true" />
          Shift tasks
        </Button>
      ) : null}
    </header>
  );
}

import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { DayProgress } from '@/features/day-of';
import { TaskTag } from '@/features/tasks';
import { formatClock, formatDay, formatTimeRange } from '@/lib/format';
import type { Dashboard, TodayFunction, TodayGeneral } from '../api/dashboard.schema';
import { links } from '../lib/dashboard';
import { WidgetCard } from './widget-card';

type TodayWidgetProps = { today: Dashboard['todayFunctions']; className?: string };

/**
 * Spec §15 widget 1: today's functions with progress and overdue count. Open goes to S12 on that
 * function (the primary path on the day); Plan goes to S9. General rows mirror S12's chip.
 */
export function TodayWidget({ today, className }: TodayWidgetProps) {
  const { functions, general, next } = today;
  const rows = functions.length + general.length;
  return (
    <WidgetCard
      id="dashboard-today"
      title="Today"
      className={className}
      isEmpty={rows === 0}
      empty={<NothingToday next={next} />}
    >
      <ul className="divide-y divide-border">
        {functions.map((fn) => (
          <FunctionRow key={fn.id} fn={fn} />
        ))}
        {general.map((row) => (
          <GeneralRow key={row.eventId} row={row} />
        ))}
      </ul>
    </WidgetCard>
  );
}

function NothingToday({ next }: { next: Dashboard['todayFunctions']['next'] }) {
  if (next === null) return <>No functions today or in the next 60 days.</>;
  return (
    <>
      No functions today. Next:{' '}
      <Link
        to={links.event(next.eventId)}
        className="text-foreground underline decoration-gold underline-offset-4"
      >
        {next.name} · {next.eventName}
      </Link>{' '}
      <span className="tabular-nums">
        · {formatDay(next.date)}, {formatClock(next.startTime)}
      </span>
    </>
  );
}

type ProgressRowProps = {
  title: string;
  context: string;
  progress: { done: number; total: number; overdue: number };
  open: string;
  plan?: string;
};

function ProgressRow({ title, context, progress, open, plan }: ProgressRowProps) {
  return (
    <li className="flex flex-col gap-3 px-4 py-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="min-w-0">
          <span className="text-body font-semibold">{title}</span>
          <span className="text-body text-muted-foreground"> · {context}</span>
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {progress.total === 0 ? (
          <p className="flex-1 text-caption text-muted-foreground">No tasks yet</p>
        ) : (
          <DayProgress
            done={progress.done}
            total={progress.total}
            label={`${title} tasks done`}
            className="min-w-48 flex-1"
          />
        )}
        {progress.overdue > 0 ? (
          <TaskTag tone="danger">⚠ {progress.overdue} overdue</TaskTag>
        ) : null}
        <div className="flex items-center gap-1">
          <Button asChild variant="outline" className="h-12 px-4 sm:h-9">
            <Link to={open} aria-label={`Open ${title} on Today`}>
              Open
            </Link>
          </Button>
          {plan ? (
            <Button asChild variant="ghost" className="h-12 px-3 sm:h-9">
              <Link to={plan} aria-label={`Plan for ${title}`}>
                Plan
              </Link>
            </Button>
          ) : null}
        </div>
      </div>
    </li>
  );
}

function FunctionRow({ fn }: { fn: TodayFunction }) {
  const when = [formatTimeRange(fn.startTime, fn.endTime), fn.venueName]
    .filter(Boolean)
    .join(' · ');
  return (
    <ProgressRow
      title={fn.name}
      context={`${fn.eventName} · ${when}`}
      progress={fn}
      open={links.today(fn.id)}
      plan={links.byFunction(fn.eventId, fn.id)}
    />
  );
}

function GeneralRow({ row }: { row: TodayGeneral }) {
  return (
    <ProgressRow
      title="General"
      context={row.eventName}
      progress={row}
      open={links.todayGeneral(row.eventId)}
    />
  );
}

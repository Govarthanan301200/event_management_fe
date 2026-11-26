import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Button } from '@/components/ui/button';
import { TaskDialogs, useTaskDialogs } from '@/features/tasks';
import type { Agenda, AgendaTask, AgendaVendor } from '../api/agenda.schema';
import { useAppBadge } from '../hooks/use-app-badge';
import { useTodayAgenda } from '../hooks/use-agenda';
import { useConnectivity } from '../hooks/use-connectivity';
import { useNow } from '../hooks/use-now';
import { useScrollToTask } from '@/hooks/use-scroll-to-task';
import {
  defaultScope,
  groupToday,
  overdueToday,
  progressOf,
  scopeOf,
  tasksInScope,
  tasksOn,
  todayScopes,
} from '../lib/today';
import { AddTaskFab } from './add-task-fab';
import { CallSheet } from './call-sheet';
import { DayGroups } from './day-groups';
import { DayEmpty, DayError, DaySkeleton } from './day-states';
import { RemindersPrompt } from './reminders-prompt';
import { ShiftSheet } from './shift-sheet';
import { OfflineBar, OverdueStrip } from './status-strips';
import { TodayHeader } from './today-header';

/** S12 Today (spec §14): today's tasks for the current function, run from the phone. */
export function TodayPage() {
  const now = useNow();
  const agenda = useTodayAgenda(now.date);
  const { online, waiting } = useConnectivity();
  if (agenda.isPending) return <DaySkeleton label="Loading today" />;
  // Offline with a cached day: keep showing it (spec §14 offline); only a first load can fail.
  if (agenda.isError && !agenda.data)
    return <DayError what="today's tasks" onRetry={() => void agenda.refetch()} />;
  return (
    <div className="flex flex-col gap-4 pb-24 sm:pb-0">
      <OfflineBar online={online} waiting={waiting} />
      <TodayView agenda={agenda.data} now={now} online={online} />
    </div>
  );
}

type TodayViewProps = { agenda: Agenda; now: { date: string; time: string }; online: boolean };

type Sheet =
  { kind: 'call'; task: AgendaTask & { vendor: AgendaVendor } } | { kind: 'shift' } | null;

function TodayView({ agenda, now, online }: TodayViewProps) {
  const [params, setParams] = useSearchParams();
  const [sheet, setSheet] = useState<Sheet>(null);
  const today = tasksOn(agenda.tasks, now.date);
  const scopes = todayScopes(agenda.functions, agenda.tasks, now.date);
  const arrivedId = params.get('task');
  const arrived = today.find((task) => task.id === arrivedId);
  const scope =
    scopes.find((option) => option.id === params.get('scope')) ??
    (arrived ? scopeOf(arrived, scopes) : undefined) ??
    defaultScope(scopes, now.time);
  const dialogs = useTaskDialogs(scope?.kind === 'function' ? scope.fn.eventId : scope?.eventId);
  const overdue = overdueToday(agenda.tasks, now);
  useAppBadge(overdue.length);
  useScrollToTask(arrived ? arrived.id : null);

  const choose = (patch: Record<string, string | null>) => {
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        for (const [key, value] of Object.entries(patch)) {
          if (value === null) next.delete(key);
          else next.set(key, value);
        }
        return next;
      },
      { replace: true },
    );
  };

  if (!scope) {
    return (
      <>
        <RemindersPrompt />
        <DayEmpty
          title="Nothing on today"
          action={
            <Button asChild variant="outline" className="h-12 px-4">
              <Link to="/upcoming">See upcoming tasks</Link>
            </Button>
          }
        >
          No function or task falls today. Pre-event tasks for the next two weeks are on Upcoming.
        </DayEmpty>
      </>
    );
  }

  const inScope = tasksInScope(today, scope, scopes);
  const callable = (task: AgendaTask) => {
    if (task.vendor) setSheet({ kind: 'call', task: { ...task, vendor: task.vendor } });
  };

  return (
    <>
      <OverdueStrip
        tasks={overdue}
        onOpen={(task) => {
          const owner = scopeOf(task, scopes);
          choose({ scope: owner?.id ?? null, task: task.id });
        }}
      />
      <TodayHeader
        today={now.date}
        scope={scope}
        scopes={scopes}
        onScope={(id) => {
          choose({ scope: id, task: null });
        }}
        progress={progressOf(inScope)}
        onShift={
          scope.kind === 'function'
            ? () => {
                setSheet({ kind: 'shift' });
              }
            : null
        }
      />
      <RemindersPrompt />
      {inScope.length === 0 ? (
        <DayEmpty
          title={`Nothing to do for ${scope.kind === 'function' ? scope.fn.name : 'General'} yet`}
        >
          Add what has to happen today, with a time to get a reminder.
        </DayEmpty>
      ) : (
        <DayGroups
          groups={groupToday(inScope, now.time)}
          actions={dialogs.actions}
          onCall={callable}
          arrivedId={arrivedId}
        />
      )}
      <div className="sm:order-first sm:self-end">
        <AddTaskFab
          onClick={() => {
            dialogs.add(
              scope.kind === 'function' ? { functionIds: [scope.fn.id] } : { dueDate: now.date },
            );
          }}
        />
      </div>
      <TaskDialogs open={dialogs.open} onClose={dialogs.close} />
      {sheet?.kind === 'call' ? (
        <CallSheet
          task={sheet.task}
          onClose={() => {
            setSheet(null);
          }}
        />
      ) : null}
      {sheet?.kind === 'shift' && scope.kind === 'function' ? (
        <ShiftSheet
          fn={scope.fn}
          tasks={inScope}
          online={online}
          onClose={() => {
            setSheet(null);
          }}
        />
      ) : null}
    </>
  );
}

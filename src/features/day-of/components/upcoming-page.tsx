import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { isOverdue, TaskDialogs, useTaskDialogs } from '@/features/tasks';
import type { Agenda, AgendaTask, AgendaVendor } from '../api/agenda.schema';
import { useUpcomingAgenda } from '../hooks/use-agenda';
import { useConnectivity } from '../hooks/use-connectivity';
import { useNow } from '../hooks/use-now';
import { useScrollToTask } from '../hooks/use-scroll-to-task';
import { groupUpcoming } from '../lib/upcoming';
import { AddTaskFab } from './add-task-fab';
import { CallSheet } from './call-sheet';
import { GroupHeading } from './day-groups';
import { DayEmpty, DayError, DaySkeleton } from './day-states';
import { DayTaskCard } from './day-task-card';
import { DoneRow } from './done-row';
import { eventsIn } from '../lib/events';
import { EventPicker } from './event-picker';
import { OfflineBar } from './status-strips';

/** Upcoming (spec §14): the next 14 days' tasks that aren't day-of, across events, by date. */
export function UpcomingPage() {
  const now = useNow();
  const agenda = useUpcomingAgenda(now.date);
  const { online, waiting } = useConnectivity();
  return (
    <div className="flex flex-col gap-4 pb-24 sm:pb-0">
      <OfflineBar online={online} waiting={waiting} />
      <header className="flex flex-col gap-1">
        <h1 className="text-headline">Upcoming</h1>
        <p className="text-body-touch text-muted-foreground">Next 14 days · all events</p>
      </header>
      {agenda.isPending ? <DaySkeleton label="Loading upcoming tasks" /> : null}
      {agenda.isError && !agenda.data ? (
        <DayError what="upcoming tasks" onRetry={() => void agenda.refetch()} />
      ) : null}
      {agenda.data ? <UpcomingList agenda={agenda.data} now={now} /> : null}
    </div>
  );
}

type UpcomingListProps = { agenda: Agenda; now: { date: string; time: string } };

function UpcomingList({ agenda, now }: UpcomingListProps) {
  const [params] = useSearchParams();
  const [calling, setCalling] = useState<(AgendaTask & { vendor: AgendaVendor }) | null>(null);
  const [picking, setPicking] = useState(false);
  const events = eventsIn([...agenda.functions, ...agenda.tasks]);
  const dialogs = useTaskDialogs(events.length === 1 ? events[0]?.id : undefined);
  const groups = groupUpcoming(agenda.tasks, now.date);
  const arrivedId = params.get('task');
  useScrollToTask(arrivedId);

  const add = () => {
    if (events.length > 1) setPicking(true);
    else dialogs.add({ dueDate: now.date });
  };

  return (
    <>
      {groups.length === 0 ? (
        <DayEmpty title="Nothing due in the next 14 days">
          Pre-event tasks, like a food tasting or an advance to pay, show here by date.
        </DayEmpty>
      ) : (
        <div className="flex flex-col gap-6">
          {groups.map((group) => (
            <section
              key={group.id}
              aria-labelledby={`up-${group.id}`}
              className="flex flex-col gap-3"
            >
              <GroupHeading id={`up-${group.id}`} danger={group.overdue}>
                {group.title}
              </GroupHeading>
              <ul className="flex flex-col gap-3">
                {group.tasks.map((task) =>
                  task.status === 'done' ? (
                    <DoneRow key={task.id} task={task} actions={dialogs.actions} />
                  ) : (
                    <DayTaskCard
                      key={task.id}
                      task={task}
                      actions={dialogs.actions}
                      onCall={(target) => {
                        if (target.vendor) setCalling({ ...target, vendor: target.vendor });
                      }}
                      overdue={isOverdue(task, now)}
                      context={{ event: true, date: group.overdue }}
                      arrived={task.id === arrivedId}
                    />
                  ),
                )}
              </ul>
            </section>
          ))}
        </div>
      )}
      {events.length > 0 ? (
        <div className="sm:order-first sm:self-end">
          <AddTaskFab onClick={add} />
        </div>
      ) : null}
      <TaskDialogs open={dialogs.open} onClose={dialogs.close} />
      {calling ? (
        <CallSheet
          task={calling}
          onClose={() => {
            setCalling(null);
          }}
        />
      ) : null}
      {picking ? (
        <EventPicker
          events={events}
          onClose={() => {
            setPicking(false);
          }}
          onPick={(eventId) => {
            setPicking(false);
            dialogs.add({ dueDate: now.date }, eventId);
          }}
        />
      ) : null}
    </>
  );
}

import { AlertTriangle, ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { TaskActions } from '@/features/tasks';
import { cn } from '@/lib/utils';
import type { AgendaTask } from '../api/agenda.schema';
import type { TodayGroup } from '../lib/today';
import { DayTaskCard } from './day-task-card';
import { DoneRow } from './done-row';

type DayGroupsProps = {
  groups: readonly TodayGroup[];
  actions: TaskActions;
  onCall: (task: AgendaTask) => void;
  arrivedId: string | null;
};

/** Group headers in `overline`; Overdue on a `danger-soft` band with ⚠; Done collapsed. */
export function DayGroups({ groups, actions, onCall, arrivedId }: DayGroupsProps) {
  return (
    <div className="flex flex-col gap-6">
      {groups.map((group) =>
        group.id === 'done' ? (
          <DoneGroup key={group.id} tasks={group.tasks} actions={actions} />
        ) : (
          <section
            key={group.id}
            aria-labelledby={`group-${group.id}`}
            className="flex flex-col gap-3"
          >
            <GroupHeading
              id={`group-${group.id}`}
              danger={group.id === 'overdue' || group.id === 'issue'}
            >
              {group.title}
            </GroupHeading>
            <ul className="flex flex-col gap-3">
              {group.tasks.map((task) => (
                <DayTaskCard
                  key={task.id}
                  task={task}
                  actions={actions}
                  onCall={onCall}
                  overdue={group.id === 'overdue'}
                  arrived={task.id === arrivedId}
                />
              ))}
            </ul>
          </section>
        ),
      )}
    </div>
  );
}

type GroupHeadingProps = { id: string; danger: boolean; children: string };

export function GroupHeading({ id, danger, children }: GroupHeadingProps) {
  return (
    <h2
      id={id}
      className={cn(
        'flex items-center gap-1.5 text-overline',
        danger ? 'rounded-sm bg-danger-soft px-3 py-1.5 text-danger' : 'text-muted-foreground',
      )}
    >
      {danger ? <AlertTriangle className="size-4" strokeWidth={1.5} aria-hidden="true" /> : null}
      {children}
    </h2>
  );
}

type DoneGroupProps = { tasks: readonly AgendaTask[]; actions: TaskActions };

function DoneGroup({ tasks, actions }: DoneGroupProps) {
  return (
    <Collapsible className="flex flex-col gap-2">
      <CollapsibleTrigger className="group flex h-12 items-center justify-between rounded-sm text-overline text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
        <span>
          Done · <span className="tabular-nums">{tasks.length}</span>
        </span>
        <ChevronDown
          className="size-5 transition-transform duration-200 group-data-[state=open]:rotate-180"
          strokeWidth={1.5}
          aria-hidden="true"
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ul className="divide-y divide-border rounded-md border border-border bg-card sunlight:border-2">
          {tasks.map((task) => (
            <DoneRow key={task.id} task={task} actions={actions} />
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
}

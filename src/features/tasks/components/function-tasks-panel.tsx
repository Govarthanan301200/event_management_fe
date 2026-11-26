import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { EventFunction } from '@/features/events';
import { useTaskDialogs } from '../hooks/use-task-dialogs';
import { useTasks } from '../hooks/use-tasks';
import { groupTasks, nowIn } from '../lib/task-groups';
import { TaskDialogs } from './task-dialogs';
import { TaskRows } from './task-list';

type FunctionTasksPanelProps = { eventId: string; fn: EventFunction };

/** S9 Tasks panel (spec §12): the function's linked tasks, and Add task for it (spec §13). */
export function FunctionTasksPanel({ eventId, fn }: FunctionTasksPanelProps) {
  const tasks = useTasks(eventId);
  const dialogs = useTaskDialogs(eventId);
  const linked = (tasks.data ?? []).filter((task) => task.eventFunctionId === fn.id);
  const ordered = groupTasks(linked, [fn]).flatMap((section) => section.tasks);
  const rows =
    ordered.length === 0 ? (
      <p className="bg-card px-4 py-3 text-label text-muted-foreground">
        No tasks for {fn.name} yet.
      </p>
    ) : (
      <TaskRows tasks={ordered} showDate={false} now={nowIn()} actions={dialogs.actions} />
    );

  return (
    <section aria-labelledby="fn-tasks" className="overflow-hidden rounded-md border border-border">
      <div className="flex items-center justify-between gap-3 bg-muted px-4 py-2">
        <h3 id="fn-tasks" className="text-overline">
          Tasks
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            dialogs.add({ functionIds: [fn.id] });
          }}
        >
          Add task
        </Button>
      </div>
      <PanelBody state={tasks}>{rows}</PanelBody>
      <TaskDialogs eventId={eventId} open={dialogs.open} onClose={dialogs.close} />
    </section>
  );
}

type PanelBodyProps = {
  state: ReturnType<typeof useTasks>;
  /** The rows, shown once the function has tasks. */
  children: ReactNode;
};

function PanelBody({ state, children }: PanelBodyProps) {
  if (state.isPending) {
    return (
      <div aria-busy="true" aria-label="Loading tasks" className="bg-card p-4">
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }
  if (state.isError) {
    return (
      <p role="alert" className="bg-card px-4 py-3 text-label text-danger">
        ⚠ Couldn&apos;t load the tasks.
      </p>
    );
  }
  return children;
}

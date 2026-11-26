import type { ReactNode } from 'react';
import { useSearchParams } from 'react-router';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useWorkspaceEvent } from '@/features/events';
import { useTaskDialogs } from '../hooks/use-task-dialogs';
import { useTasks } from '../hooks/use-tasks';
import type { Task } from '../api/tasks.schema';
import {
  applyFilters,
  groupTasks,
  NO_FUNCTION,
  nowIn,
  readFilters,
  vendorOptions,
} from '../lib/task-groups';
import { TaskDialogs } from './task-dialogs';
import { TaskFiltersBar } from './task-filters';
import { TaskList } from './task-list';

/**
 * S11 Tasks (spec §13): Pre-event by date, Day-of by function then time, and After the event
 * (decision 2026-11-26), with status, function and vendor filters kept in the URL.
 */
export function TasksPage() {
  const { event } = useWorkspaceEvent();
  const tasks = useTasks(event.id);
  const dialogs = useTaskDialogs(event.id);
  const [params, setParams] = useSearchParams();
  const filters = readFilters(params);

  const setFilter = (key: 'status' | 'fn' | 'vendor', value: string | null) => {
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (value === null) next.delete(key);
        else next.set(key, value);
        return next;
      },
      { replace: true },
    );
  };

  const header = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <TaskFiltersBar
        filters={filters}
        functions={event.functions}
        vendors={vendorOptions(tasks.data ?? [])}
        onChange={setFilter}
        onClear={() => {
          setParams({}, { replace: true });
        }}
      />
      <Button
        className="h-10 px-4"
        onClick={() => {
          dialogs.add({
            functionIds: filters.fn && filters.fn !== NO_FUNCTION ? [filters.fn] : [],
          });
        }}
      >
        Add task
      </Button>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      {header}
      <TasksBody
        state={tasks}
        render={(all) => {
          const shown = applyFilters(all, filters);
          if (all.length === 0) {
            return (
              <div className="flex flex-col items-start gap-2 py-12">
                <h2 className="text-title-serif">Add your first task</h2>
                <p className="text-body text-muted-foreground">
                  Tasks on a function&apos;s date make that day&apos;s checklist; the rest are
                  pre-event. Add them here, from a service, or from a function.
                </p>
              </div>
            );
          }
          if (shown.length === 0) {
            return (
              <div className="flex flex-col items-start gap-2 py-8">
                <p className="text-body text-muted-foreground">No tasks match these filters.</p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setParams({}, { replace: true });
                  }}
                >
                  Clear filters
                </Button>
              </div>
            );
          }
          return (
            <TaskList
              sections={groupTasks(shown, event.functions)}
              now={nowIn()}
              actions={dialogs.actions}
            />
          );
        }}
      />
      <TaskDialogs open={dialogs.open} onClose={dialogs.close} />
    </div>
  );
}

type TasksBodyProps = {
  state: ReturnType<typeof useTasks>;
  render: (tasks: Task[]) => ReactNode;
};

function TasksBody({ state, render }: TasksBodyProps) {
  if (state.isPending) {
    return (
      <div aria-busy="true" aria-label="Loading tasks" className="flex flex-col gap-3">
        <Skeleton className="h-24 w-full rounded-md" />
        <Skeleton className="h-24 w-full rounded-md" />
      </div>
    );
  }
  if (state.isError) {
    return (
      <div role="alert" className="flex flex-col items-start gap-3">
        <p className="text-body text-danger">⚠ Couldn&apos;t load the tasks.</p>
        <Button variant="outline" onClick={() => void state.refetch()}>
          Try again
        </Button>
      </div>
    );
  }
  return <>{render(state.data)}</>;
}

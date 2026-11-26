import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { tasksOptions } from '@/features/tasks';

type LineTasksProps = {
  eventId: string;
  /** The saved line; a new one has to be saved before tasks can point to it. */
  lineId: string | null;
  onAdd: () => void;
};

/** S8 step 7 (spec §11): "+ Add task", pre-filled with this line's vendor and functions. */
export function LineTasks({ eventId, lineId, onAdd }: LineTasksProps) {
  const tasks = useQuery({ ...tasksOptions(eventId), enabled: lineId !== null });
  const count = (tasks.data ?? []).filter((task) => task.serviceLineId === lineId).length;
  return (
    <div className="flex flex-col gap-1">
      <p className="text-label font-medium">Tasks</p>
      {lineId === null ? (
        <p className="text-caption text-muted-foreground">Save the service to add tasks for it.</p>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="outline" size="sm" onClick={onAdd}>
            <Plus className="size-4" strokeWidth={1.5} aria-hidden="true" />
            Add task
          </Button>
          {count > 0 ? (
            <span className="text-caption text-muted-foreground">
              {count === 1 ? '1 task' : `${count} tasks`} for this service
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
}

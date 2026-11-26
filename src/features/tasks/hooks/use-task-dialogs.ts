import { useState } from 'react';
import { toast } from 'sonner';
import type { StatusChange, Task } from '../api/tasks.schema';
import type { TaskDialogMode } from '../components/task-dialog';
import { useSetTaskStatus } from './use-tasks';

export type OpenDialog =
  | { kind: 'task'; mode: TaskDialogMode }
  | { kind: 'issue'; task: Task }
  | { kind: 'delete'; task: Task };

/** What a task row can do, and which dialog is open: shared by S11 and the S9 panel. */
export function useTaskDialogs(eventId: string) {
  const [open, setOpen] = useState<OpenDialog | null>(null);
  const setStatus = useSetTaskStatus(eventId);

  /** Done ↔ not done. Done offers Undo for 5 seconds (design system), back to how it was. */
  const toggleDone = (task: Task) => {
    const previous: StatusChange =
      task.status === 'issue' && task.issueNote !== null
        ? { status: 'issue', issueNote: task.issueNote }
        : { status: 'pending' };
    if (task.status === 'done') {
      setStatus.mutate({ taskId: task.id, change: { status: 'pending' } });
      return;
    }
    setStatus.mutate(
      { taskId: task.id, change: { status: 'done' } },
      {
        onSuccess: () => {
          toast.success('Marked done', {
            duration: 5000,
            action: {
              label: 'Undo',
              onClick: () => {
                setStatus.mutate({ taskId: task.id, change: previous });
              },
            },
          });
        },
        onError: () => {
          toast.error("Couldn't mark it done. Try again.");
        },
      },
    );
  };

  return {
    open,
    close: () => {
      setOpen(null);
    },
    add: (preset: Extract<TaskDialogMode, { kind: 'add' }>['preset'] = {}) => {
      setOpen({ kind: 'task', mode: { kind: 'add', preset } });
    },
    actions: {
      toggleDone,
      edit: (task: Task) => {
        setOpen({ kind: 'task', mode: { kind: 'edit', task } });
      },
      markIssue: (task: Task) => {
        setOpen({ kind: 'issue', task });
      },
      reopen: (task: Task) => {
        setStatus.mutate({ taskId: task.id, change: { status: 'pending' } });
      },
      remove: (task: Task) => {
        setOpen({ kind: 'delete', task });
      },
    },
  };
}

export type TaskActions = ReturnType<typeof useTaskDialogs>['actions'];

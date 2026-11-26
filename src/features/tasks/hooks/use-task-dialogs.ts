import { useState } from 'react';
import { toast } from 'sonner';
import type { Task } from '../api/tasks.schema';
import type { TaskDialogMode } from '../components/task-dialog';
import { previousStatus } from '../lib/status-sync';
import { useTaskStatus } from './use-task-status';

export type OpenDialog =
  | { kind: 'task'; eventId: string; mode: TaskDialogMode }
  | { kind: 'issue'; task: Task }
  | { kind: 'delete'; task: Task };

type AddPreset = Extract<TaskDialogMode, { kind: 'add' }>['preset'];

/**
 * What a task row or card can do, and which dialog is open: shared by S11, the S9 panel, Today
 * and Upcoming. Each action uses the task's own event, so a list may span events (Module 8).
 * `eventId` is where Add puts a task unless `add` names another.
 */
export function useTaskDialogs(eventId?: string) {
  const [open, setOpen] = useState<OpenDialog | null>(null);
  const status = useTaskStatus();

  /**
   * Done ↔ not done. Done offers Undo for 5 seconds (design system), back to how it was. The
   * toast shows at once, because offline the change is queued and only confirmed on reconnect.
   */
  const toggleDone = (task: Task) => {
    const target = { eventId: task.eventId, taskId: task.id };
    const onError = () => {
      toast.error("Couldn't change the task. Try again.");
    };
    if (task.status === 'done') {
      status.mutate(target, { status: 'pending' }, { onError });
      return;
    }
    const previous = previousStatus(task);
    status.mutate(target, { status: 'done' }, { onError });
    toast.success('Marked done', {
      duration: 5000,
      action: {
        label: 'Undo',
        onClick: () => {
          status.mutate(target, previous, { onError });
        },
      },
    });
  };

  return {
    open,
    close: () => {
      setOpen(null);
    },
    add: (preset: AddPreset = {}, forEvent: string | undefined = eventId) => {
      if (forEvent === undefined) return;
      setOpen({ kind: 'task', eventId: forEvent, mode: { kind: 'add', preset } });
    },
    actions: {
      toggleDone,
      edit: (task: Task) => {
        setOpen({ kind: 'task', eventId: task.eventId, mode: { kind: 'edit', task } });
      },
      markIssue: (task: Task) => {
        setOpen({ kind: 'issue', task });
      },
      reopen: (task: Task) => {
        status.mutate({ eventId: task.eventId, taskId: task.id }, { status: 'pending' });
      },
      remove: (task: Task) => {
        setOpen({ kind: 'delete', task });
      },
    },
  };
}

export type TaskActions = ReturnType<typeof useTaskDialogs>['actions'];

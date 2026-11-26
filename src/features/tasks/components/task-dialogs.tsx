import type { OpenDialog } from '../hooks/use-task-dialogs';
import { DeleteTaskDialog } from './delete-task-dialog';
import { IssueDialog } from './issue-dialog';
import { TaskDialog } from './task-dialog';

type TaskDialogsProps = { open: OpenDialog | null; onClose: () => void };

/** The one task dialog that's open, if any (see `useTaskDialogs`), on the task's own event. */
export function TaskDialogs({ open, onClose }: TaskDialogsProps) {
  if (open === null) return null;
  if (open.kind === 'issue') {
    return <IssueDialog key={open.task.id} task={open.task} onClose={onClose} />;
  }
  if (open.kind === 'delete') {
    return <DeleteTaskDialog eventId={open.task.eventId} task={open.task} onClose={onClose} />;
  }
  return (
    <TaskDialog
      key={open.mode.kind === 'edit' ? open.mode.task.id : 'add'}
      eventId={open.eventId}
      mode={open.mode}
      onClose={onClose}
    />
  );
}

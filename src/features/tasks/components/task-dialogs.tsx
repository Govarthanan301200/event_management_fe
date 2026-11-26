import type { OpenDialog } from '../hooks/use-task-dialogs';
import { DeleteTaskDialog } from './delete-task-dialog';
import { IssueDialog } from './issue-dialog';
import { TaskDialog } from './task-dialog';

type TaskDialogsProps = { eventId: string; open: OpenDialog | null; onClose: () => void };

/** The one task dialog that's open, if any (see `useTaskDialogs`). */
export function TaskDialogs({ eventId, open, onClose }: TaskDialogsProps) {
  if (open === null) return null;
  if (open.kind === 'issue') {
    return <IssueDialog key={open.task.id} eventId={eventId} task={open.task} onClose={onClose} />;
  }
  if (open.kind === 'delete') {
    return <DeleteTaskDialog eventId={eventId} task={open.task} onClose={onClose} />;
  }
  return (
    <TaskDialog
      key={open.mode.kind === 'edit' ? open.mode.task.id : 'add'}
      mode={open.mode}
      onClose={onClose}
    />
  );
}

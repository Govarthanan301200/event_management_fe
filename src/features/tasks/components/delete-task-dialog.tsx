import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { errorMessage } from '@/lib/api-client';
import type { Task } from '../api/tasks.schema';
import { useDeleteTask } from '../hooks/use-tasks';

type DeleteTaskDialogProps = { eventId: string; task: Task; onClose: () => void };

/** Destructive, so confirmed first (design system). */
export function DeleteTaskDialog({ eventId, task, onClose }: DeleteTaskDialogProps) {
  const remove = useDeleteTask(eventId);
  return (
    <AlertDialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this task?</AlertDialogTitle>
          <AlertDialogDescription>
            “{task.title}” and its reminder are removed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {remove.isError ? (
          <p role="alert" className="text-label text-danger">
            ⚠ {errorMessage(remove.error, "Couldn't delete the task. Try again.")}
          </p>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel>Keep it</AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={remove.isPending}
            onClick={() => {
              remove.mutate(task.id, {
                onSuccess: () => {
                  onClose();
                  toast.success('Task deleted');
                },
              });
            }}
          >
            {remove.isPending ? 'Deleting…' : 'Delete task'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

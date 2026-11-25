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
import type { ServiceLine } from '../api/plan.schema';
import { useDeleteLine } from '../hooks/use-plan';

type RemoveLineDialogProps = { eventId: string; line: ServiceLine | null; onClose: () => void };

/** S7 Remove from plan: the line, its rows and budgets go. Confirmed first. */
export function RemoveLineDialog({ eventId, line, onClose }: RemoveLineDialogProps) {
  const remove = useDeleteLine(eventId);
  return (
    <AlertDialog
      open={line !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove {line?.serviceName} from the plan?</AlertDialogTitle>
          <AlertDialogDescription>
            Its quantities, vendors and budgets for every function are removed. You can add the
            service again later.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {remove.isError ? (
          <p role="alert" className="text-label text-danger">
            ⚠ {errorMessage(remove.error, "Couldn't remove the service. Try again.")}
          </p>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel>Keep it</AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={remove.isPending || line === null}
            onClick={() => {
              if (!line) return;
              remove.mutate(line.id, {
                onSuccess: () => {
                  onClose();
                  toast.success(`Removed ${line.serviceName}`);
                },
              });
            }}
          >
            {remove.isPending ? 'Removing…' : 'Remove from plan'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

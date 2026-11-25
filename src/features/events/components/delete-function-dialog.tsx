import { useQuery } from '@tanstack/react-query';
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
import { Skeleton } from '@/components/ui/skeleton';
import { errorMessage } from '@/lib/api-client';
import { functionImpactOptions } from '../api/events.api';
import type { EventFunction } from '../api/events.schema';
import { useDeleteFunction } from '../hooks/use-function-mutations';
import { deleteImpactText } from '../lib/function-form';

type DeleteFunctionDialogProps = {
  eventId: string;
  fn: EventFunction | null;
  onClose: () => void;
};

/** Spec §10: deleting a function warns with counts of affected function rows and tasks. */
export function DeleteFunctionDialog({ eventId, fn, onClose }: DeleteFunctionDialogProps) {
  const impact = useQuery({
    ...functionImpactOptions(eventId, fn?.id ?? ''),
    enabled: fn !== null,
  });
  const remove = useDeleteFunction(eventId);

  return (
    <AlertDialog
      open={fn !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {fn?.name}?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div>
              {impact.isPending ? (
                <Skeleton className="h-5 w-2/3" aria-label="Checking what is planned" />
              ) : impact.isError ? (
                <span>
                  Couldn&apos;t check what is planned for it. Its service rows and tasks are
                  affected too.
                </span>
              ) : (
                <span>{deleteImpactText(impact.data)}</span>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        {remove.isError ? (
          <p role="alert" className="text-label text-danger">
            ⚠ {errorMessage(remove.error, "Couldn't delete the function. Try again.")}
          </p>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={remove.isPending || fn === null}
            onClick={() => {
              if (!fn) return;
              remove.mutate(fn.id, {
                onSuccess: () => {
                  onClose();
                  toast.success(`Deleted ${fn.name}`);
                },
              });
            }}
          >
            {remove.isPending ? 'Deleting…' : 'Delete function'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

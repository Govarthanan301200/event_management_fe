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
import type { useGuestRows } from '../hooks/use-guest-rows';

type DeleteRowsDialogProps = {
  ids: readonly string[];
  remove: ReturnType<typeof useGuestRows>['remove'];
  onClose: (deleted: boolean) => void;
};

/** Deleting rows asks first (design system: destructive actions confirm or offer undo). */
export function DeleteRowsDialog({ ids, remove, onClose }: DeleteRowsDialogProps) {
  const count = ids.length === 1 ? '1 guest row' : `${String(ids.length)} guest rows`;
  return (
    <AlertDialog
      open
      onOpenChange={(open) => {
        if (!open) onClose(false);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {count}?</AlertDialogTitle>
          <AlertDialogDescription>This can&apos;t be undone.</AlertDialogDescription>
        </AlertDialogHeader>
        {remove.isError ? (
          <p role="alert" className="text-label text-danger">
            ⚠ {errorMessage(remove.error, "Couldn't delete the rows. Try again.")}
          </p>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel>Keep them</AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={remove.isPending}
            onClick={() => {
              remove.mutate([...ids], {
                onSuccess: () => {
                  onClose(true);
                  toast.success(`Deleted ${count}`);
                },
              });
            }}
          >
            {remove.isPending ? 'Deleting…' : 'Delete rows'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

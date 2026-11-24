import { useState } from 'react';
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
import { useResetCatalogue } from '../hooks/use-catalogue';
import { RowMenu } from '@/components/shared/row-menu';

type ResetCatalogueMenuProps = { canReset: boolean };

/**
 * Catalogue ⋯ menu with "Reset to template" (spec §8: only while the company has no events).
 * Confirms first, because it replaces every category, service and function type.
 */
export function ResetCatalogueMenu({ canReset }: ResetCatalogueMenuProps) {
  const [confirming, setConfirming] = useState(false);
  const reset = useResetCatalogue();

  return (
    <>
      <RowMenu
        label="Catalogue options"
        items={[
          {
            label: 'Reset to template',
            tone: 'danger',
            disabled: !canReset,
            hint: canReset ? undefined : 'Only before your first event or vendor',
            onSelect: () => {
              setConfirming(true);
            },
          },
        ]}
      />
      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Replace your catalogue with the template?</AlertDialogTitle>
            <AlertDialogDescription>
              Your categories, services and function types go back to the 11 default categories and
              77 services. Anything you added or renamed is removed. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {reset.isError ? (
            <p role="alert" className="text-label text-danger">
              ⚠ {errorMessage(reset.error, "Couldn't reset the catalogue. Try again.")}
            </p>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={reset.isPending}
              onClick={() => {
                reset.mutate(undefined, {
                  onSuccess: () => {
                    setConfirming(false);
                    toast.success('Catalogue reset to the template');
                  },
                });
              }}
            >
              {reset.isPending ? 'Resetting…' : 'Reset catalogue'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

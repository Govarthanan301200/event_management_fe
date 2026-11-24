import { useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { RowMenu } from '@/components/shared/row-menu';
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
import { archiveWithUndo } from '@/lib/archive-with-undo';
import type { VendorDetail } from '../api/vendors.schema';
import { useDeleteVendor, useUpdateVendor } from '../hooks/use-vendors';

type VendorActionsMenuProps = { vendor: VendorDetail };

/**
 * S4 ⋯ menu. Spec §6 deletion rule: a vendor used in events can only be archived; an unused one
 * can also be deleted, after a confirmation. Archive offers Undo for 5 seconds.
 */
export function VendorActionsMenu({ vendor }: VendorActionsMenuProps) {
  const [confirming, setConfirming] = useState(false);
  const update = useUpdateVendor();
  const remove = useDeleteVendor();
  const navigate = useNavigate();
  const archived = vendor.archivedAt !== null;

  return (
    <>
      <RowMenu
        label={`Actions for ${vendor.name}`}
        items={[
          archived
            ? {
                label: 'Restore',
                onSelect: () => {
                  update.mutate(
                    { id: vendor.id, change: { archived: false } },
                    {
                      onError: (error) =>
                        toast.error(errorMessage(error, "Couldn't restore. Try again.")),
                    },
                  );
                },
              }
            : {
                label: 'Archive',
                tone: 'danger',
                onSelect: () => {
                  archiveWithUndo(update.mutate, vendor);
                },
              },
          {
            label: 'Delete',
            tone: 'danger',
            disabled: !vendor.canDelete,
            hint: vendor.canDelete ? undefined : 'Used in events. Archive it instead.',
            onSelect: () => {
              setConfirming(true);
            },
          },
        ]}
      />
      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {vendor.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Their contacts, services and rates are removed too. This can&apos;t be undone. To keep
              the record but hide it, archive the vendor instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {remove.isError ? (
            <p role="alert" className="text-label text-danger">
              ⚠ {errorMessage(remove.error, "Couldn't delete the vendor. Try again.")}
            </p>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={remove.isPending}
              onClick={() => {
                remove.mutate(vendor.id, {
                  onSuccess: () => {
                    setConfirming(false);
                    toast.success(`Deleted ${vendor.name}`);
                    void navigate('/vendors', { replace: true });
                  },
                });
              }}
            >
              {remove.isPending ? 'Deleting…' : 'Delete vendor'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

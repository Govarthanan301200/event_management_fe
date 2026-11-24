import { toast } from 'sonner';
import { errorMessage } from '@/lib/api-client';

type ArchiveVariables = { id: string; change: { archived: boolean } };
type MutateOptions = { onSuccess?: () => void; onError?: (error: Error) => void };

/**
 * Archives an item, then offers Undo for 5 seconds (design system: destructive actions confirm
 * or offer undo). `mutate` is the item's update mutation.
 */
export function archiveWithUndo(
  mutate: (variables: ArchiveVariables, options?: MutateOptions) => void,
  item: { id: string; name: string },
): void {
  mutate(
    { id: item.id, change: { archived: true } },
    {
      onSuccess: () => {
        toast(`Archived ${item.name}`, {
          duration: 5000,
          action: {
            label: 'Undo',
            onClick: () => {
              mutate({ id: item.id, change: { archived: false } });
            },
          },
        });
      },
      onError: (error) => {
        toast.error(errorMessage(error, `Couldn't archive ${item.name}. Try again.`));
      },
    },
  );
}

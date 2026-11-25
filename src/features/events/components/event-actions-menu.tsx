import { useState } from 'react';
import { toast } from 'sonner';
import { RowMenu, type RowMenuItem } from '@/components/shared/row-menu';
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
import type { StatusChange } from '../api/events.api';
import type { EventDetail } from '../api/events.schema';
import { useChangeEventStatus } from '../hooks/use-event-mutations';

type EventActionsMenuProps = { event: EventDetail; onEditDetails: () => void };

const DONE_MESSAGE: Record<StatusChange, string> = {
  completed: 'Marked completed',
  cancelled: 'Event cancelled',
  planning: 'Event reopened',
};

/**
 * S6 ⋯ menu (spec §10 + decision 2026-11-25): Mark completed and Cancel event while the event is
 * open; Reopen event (back to Planning) once it is completed or cancelled.
 */
export function EventActionsMenu({ event, onEditDetails }: EventActionsMenuProps) {
  const [confirmCancel, setConfirmCancel] = useState(false);
  const status = useChangeEventStatus(event.id);
  const closed = event.status === 'completed' || event.status === 'cancelled';
  const change = (to: StatusChange, onDone?: () => void) => {
    status.mutate(to, {
      onSuccess: () => {
        onDone?.();
        toast.success(DONE_MESSAGE[to]);
      },
      onError: (error) =>
        toast.error(errorMessage(error, "Couldn't change the status. Try again.")),
    });
  };

  const items: RowMenuItem[] = [{ label: 'Edit details', onSelect: onEditDetails }];
  if (closed) {
    items.push({
      label: 'Reopen event',
      hint: 'Back to Planning',
      onSelect: () => {
        change('planning');
      },
    });
  } else {
    items.push(
      {
        label: 'Mark completed',
        onSelect: () => {
          change('completed');
        },
      },
      {
        label: 'Cancel event',
        tone: 'danger',
        onSelect: () => {
          setConfirmCancel(true);
        },
      },
    );
  }

  return (
    <>
      <RowMenu label={`Actions for ${event.name}`} items={items} />
      <AlertDialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel {event.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              The client form link closes. Functions and details are kept, and you can reopen the
              event later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep event</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={status.isPending}
              onClick={() => {
                change('cancelled', () => {
                  setConfirmCancel(false);
                });
              }}
            >
              {status.isPending ? 'Cancelling…' : 'Cancel event'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

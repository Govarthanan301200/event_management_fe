import { useState } from 'react';
import { toast } from 'sonner';
import { SortableList } from '@/components/shared/sortable-list';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { errorMessage } from '@/lib/api-client';
import { moveBy, moveTo } from '@/lib/order';
import type { EventDetail, EventFunction } from '../api/events.schema';
import { useReorderFunctions } from '../hooks/use-function-mutations';
import { DeleteFunctionDialog } from './delete-function-dialog';
import { FunctionDialog } from './function-dialog';
import { FunctionRow } from './function-row';

type FunctionsSectionProps = { event: EventDetail };
type DialogState = { kind: 'add' } | { kind: 'edit'; fn: EventFunction } | null;

/** S6 functions table: add, edit, reorder and delete (spec §10). Add function is the page's primary action. */
export function FunctionsSection({ event }: FunctionsSectionProps) {
  const [dialog, setDialog] = useState<DialogState>(null);
  const [deleting, setDeleting] = useState<EventFunction | null>(null);
  const reorder = useReorderFunctions(event.id);
  const functions = event.functions;
  const ids = functions.map((fn) => fn.id);
  const save = (next: string[]) => {
    reorder.mutate(next, {
      onError: (error) =>
        toast.error(errorMessage(error, "Couldn't save the new order. Try again.")),
    });
  };

  return (
    <section aria-labelledby="functions-heading" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="functions-heading" className="text-heading">
          Functions {functions.length > 0 ? `(${functions.length})` : ''}
        </h2>
        <Button
          className="h-10 px-4"
          onClick={() => {
            setDialog({ kind: 'add' });
          }}
        >
          Add function
        </Button>
      </div>

      {functions.length === 0 ? (
        <div className="flex flex-col gap-2 rounded-md border border-border bg-card px-4 py-8">
          <h3 className="text-title-serif">Add your first function</h3>
          <p className="text-body text-muted-foreground">
            Mehendi, Sangeet, Muhurtham: each gets its own date, venue and guest count.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border border-border bg-card">
          <SortableList
            ids={ids}
            nameOf={(id) => functions.find((fn) => fn.id === id)?.name ?? 'function'}
            onMove={(id, overId) => {
              save(moveTo(ids, id, overId));
            }}
          >
            <Table className="table-fixed">
              <TableHeader className="bg-muted">
                <TableRow>
                  <TableHead className="w-8">
                    <span className="sr-only">Reorder</span>
                  </TableHead>
                  <TableHead className="text-label text-muted-foreground">Function</TableHead>
                  <TableHead className="hidden w-28 text-label text-muted-foreground sm:table-cell">
                    Date
                  </TableHead>
                  <TableHead className="hidden w-48 text-label text-muted-foreground sm:table-cell">
                    Time
                  </TableHead>
                  <TableHead className="hidden text-label text-muted-foreground lg:table-cell">
                    Venue
                  </TableHead>
                  <TableHead className="w-24 text-right text-label text-muted-foreground">
                    Guests
                  </TableHead>
                  <TableHead className="w-10">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {functions.map((fn, index) => (
                  <FunctionRow
                    key={fn.id}
                    fn={fn}
                    actions={[
                      {
                        label: 'Edit',
                        onSelect: () => {
                          setDialog({ kind: 'edit', fn });
                        },
                      },
                      {
                        label: 'Move up',
                        disabled: index === 0,
                        onSelect: () => {
                          save(moveBy(ids, fn.id, -1));
                        },
                      },
                      {
                        label: 'Move down',
                        disabled: index === functions.length - 1,
                        onSelect: () => {
                          save(moveBy(ids, fn.id, 1));
                        },
                      },
                      {
                        label: 'Delete',
                        tone: 'danger',
                        onSelect: () => {
                          setDeleting(fn);
                        },
                      },
                    ]}
                  />
                ))}
              </TableBody>
            </Table>
          </SortableList>
        </div>
      )}

      {/* Mounted only while open, so every Add starts empty and every Edit starts from the saved values. */}
      {dialog ? (
        <FunctionDialog
          key={dialog.kind === 'edit' ? dialog.fn.id : 'add'}
          eventId={event.id}
          open
          onOpenChange={(open) => {
            if (!open) setDialog(null);
          }}
          editing={dialog.kind === 'edit' ? dialog.fn : undefined}
        />
      ) : null}
      <DeleteFunctionDialog
        eventId={event.id}
        fn={deleting}
        onClose={() => {
          setDeleting(null);
        }}
      />
    </section>
  );
}

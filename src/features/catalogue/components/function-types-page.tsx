import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { FunctionType } from '../api/catalogue.schema';
import {
  useCreateFunctionType,
  useFunctionTypes,
  useReorderFunctionTypes,
  useUpdateFunctionType,
} from '../hooks/use-function-types';
import { archiveWithUndo } from '@/lib/archive-with-undo';
import { moveBy, moveTo, withArchivedLast } from '@/lib/order';
import { ArchivedSection } from './archived-section';
import { FunctionTypeRow } from './function-type-row';
import { NameDialog } from './name-dialog';
import { SortableList } from '@/components/shared/sortable-list';

type DialogState = { kind: 'add' } | { kind: 'rename'; type: FunctionType } | null;

/** Settings › Function types (spec §3, §5): add, rename, reorder, archive. */
export function FunctionTypesPage() {
  const query = useFunctionTypes();
  const create = useCreateFunctionType();
  const update = useUpdateFunctionType();
  const reorder = useReorderFunctionTypes();
  const [dialog, setDialog] = useState<DialogState>(null);

  if (query.isPending) {
    return (
      <div aria-busy="true" aria-label="Loading function types" className="flex flex-col gap-2">
        {['a', 'b', 'c', 'd'].map((key) => (
          <Skeleton key={key} className="h-11 w-full" />
        ))}
      </div>
    );
  }
  if (query.isError) {
    return (
      <div role="alert" className="flex flex-col items-start gap-3 py-8">
        <p className="text-body text-danger">⚠ Couldn&apos;t load your function types.</p>
        <Button variant="outline" onClick={() => void query.refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  const types = query.data;
  const active = types.filter((type) => !type.archivedAt);
  const archived = types.filter((type) => type.archivedAt);
  const ids = active.map((type) => type.id);
  const save = (nextIds: string[]) => {
    reorder.mutate(withArchivedLast(nextIds, types));
  };

  return (
    <section aria-labelledby="function-types-heading" className="flex max-w-2xl flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 id="function-types-heading" className="text-heading">
            Function types
          </h2>
          <p className="text-body text-muted-foreground">
            The functions you can add to an event, in this order.
          </p>
        </div>
        <Button
          onClick={() => {
            setDialog({ kind: 'add' });
          }}
        >
          Add function type
        </Button>
      </header>

      {active.length === 0 ? (
        <div className="flex flex-col gap-2 rounded-md border border-border bg-card px-4 py-8">
          <h3 className="text-title-serif">Add your first function type</h3>
          <p className="text-body text-muted-foreground">
            For example Mehendi, Sangeet or Muhurtham.
          </p>
        </div>
      ) : (
        <SortableList
          ids={ids}
          nameOf={(id) => active.find((type) => type.id === id)?.name ?? 'function type'}
          onMove={(id, overId) => {
            save(moveTo(ids, id, overId));
          }}
        >
          <ul
            aria-label="Function types"
            className="divide-y divide-border rounded-md border border-border bg-card"
          >
            {active.map((type, index) => (
              <FunctionTypeRow
                key={type.id}
                functionType={type}
                actions={[
                  {
                    label: 'Rename',
                    onSelect: () => {
                      setDialog({ kind: 'rename', type });
                    },
                  },
                  {
                    label: 'Move up',
                    disabled: index === 0,
                    onSelect: () => {
                      save(moveBy(ids, type.id, -1));
                    },
                  },
                  {
                    label: 'Move down',
                    disabled: index === active.length - 1,
                    onSelect: () => {
                      save(moveBy(ids, type.id, 1));
                    },
                  },
                  {
                    label: 'Archive',
                    tone: 'danger',
                    onSelect: () => {
                      archiveWithUndo(update.mutate, type);
                    },
                  },
                ]}
              />
            ))}
          </ul>
        </SortableList>
      )}

      <ArchivedSection
        title="Archived function types"
        items={archived}
        onRestore={(type) => {
          update.mutate({ id: type.id, change: { archived: false } });
        }}
      />

      <NameDialog
        open={dialog !== null}
        onOpenChange={(open) => {
          if (!open) setDialog(null);
        }}
        title={dialog?.kind === 'rename' ? 'Rename function type' : 'Add function type'}
        label="Name"
        initialName={dialog?.kind === 'rename' ? dialog.type.name : ''}
        maxLength={80}
        submitLabel={dialog?.kind === 'rename' ? 'Rename' : 'Add function type'}
        pendingLabel="Saving…"
        onSubmit={(name) =>
          dialog?.kind === 'rename'
            ? update.mutateAsync({ id: dialog.type.id, change: { name } })
            : create.mutateAsync(name)
        }
      />
    </section>
  );
}

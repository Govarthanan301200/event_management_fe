import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { errorMessage } from '@/lib/api-client';
import type { CatalogueCategory } from '../api/catalogue.schema';
import { useReorderCategories, useUpdateCategory } from '../hooks/use-catalogue';
import { archiveWithUndo } from '@/lib/archive-with-undo';
import { moveBy, withArchivedLast } from '@/lib/order';
import type { ServiceDialogMode } from '../lib/service-form';
import { CategorySettings } from './category-settings';
import { NameDialog } from './name-dialog';
import { RowMenu } from '@/components/shared/row-menu';
import { ServiceDialog } from './service-dialog';
import { ServiceTable } from './service-table';

type CategoryPanelProps = {
  category: CatalogueCategory;
  /** Every category, in order (for Move up / down and "move service to"). */
  categories: CatalogueCategory[];
};

/** S2 right pane: one category's rules and services. "Add service" is the view's primary action. */
export function CategoryPanel({ category, categories }: CategoryPanelProps) {
  const [serviceDialog, setServiceDialog] = useState<ServiceDialogMode | null>(null);
  const [renaming, setRenaming] = useState(false);
  const update = useUpdateCategory();
  const reorder = useReorderCategories();
  const active = categories.filter((item) => !item.archivedAt);
  const activeIds = active.map((item) => item.id);
  const index = activeIds.indexOf(category.id);
  const archived = category.archivedAt !== null;

  const move = (delta: -1 | 1) => {
    reorder.mutate(withArchivedLast(moveBy(activeIds, category.id, delta), categories));
  };
  const restore = () => {
    update.mutate(
      { id: category.id, change: { archived: false } },
      { onError: (error) => toast.error(errorMessage(error, "Couldn't restore. Try again.")) },
    );
  };

  return (
    <section aria-labelledby="category-heading" className="flex min-w-0 flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <h2 id="category-heading" className="truncate text-heading">
            {category.name}
          </h2>
          {archived ? (
            <span className="rounded-sm bg-muted px-2 py-0.5 text-caption font-medium text-muted-foreground">
              Archived
            </span>
          ) : null}
          <RowMenu
            label={`Actions for ${category.name}`}
            items={[
              {
                label: 'Rename category',
                onSelect: () => {
                  setRenaming(true);
                },
              },
              ...(archived
                ? []
                : [
                    {
                      label: 'Move up',
                      disabled: index <= 0,
                      onSelect: () => {
                        move(-1);
                      },
                    },
                    {
                      label: 'Move down',
                      disabled: index === active.length - 1,
                      onSelect: () => {
                        move(1);
                      },
                    },
                    {
                      label: 'Archive category',
                      tone: 'danger' as const,
                      onSelect: () => {
                        archiveWithUndo(update.mutate, category);
                      },
                    },
                  ]),
            ]}
          />
        </div>
        {archived ? (
          <Button onClick={restore} disabled={update.isPending}>
            Restore category
          </Button>
        ) : (
          <Button
            onClick={() => {
              setServiceDialog({ kind: 'add', category });
            }}
          >
            Add service
          </Button>
        )}
      </header>

      {archived ? (
        <p className="text-body text-muted-foreground">
          This category is archived. Its services are hidden from the client form and from new
          plans.
        </p>
      ) : null}

      <CategorySettings category={category} />
      <ServiceTable
        category={category}
        onAdd={() => {
          setServiceDialog({ kind: 'add', category });
        }}
        onEdit={(service) => {
          setServiceDialog({ kind: 'edit', service, category });
        }}
      />

      <ServiceDialog
        mode={serviceDialog}
        categories={active}
        onClose={() => {
          setServiceDialog(null);
        }}
      />
      <NameDialog
        open={renaming}
        onOpenChange={setRenaming}
        title="Rename category"
        label="Category name"
        initialName={category.name}
        maxLength={120}
        submitLabel="Rename"
        pendingLabel="Renaming…"
        onSubmit={(name) => update.mutateAsync({ id: category.id, change: { name } })}
      />
    </section>
  );
}

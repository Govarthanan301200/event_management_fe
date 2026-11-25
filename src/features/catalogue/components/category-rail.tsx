import { ChevronRight } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import type { Catalogue, CatalogueCategory } from '../api/catalogue.schema';
import { useReorderCategories } from '../hooks/use-catalogue';
import { useSortableRow } from '@/hooks/use-sortable-row';
import { moveTo, withArchivedLast } from '@/lib/order';
import { AddCategoryDialog } from './add-category-dialog';
import { DragHandle } from '@/components/shared/drag-handle';
import { ResetCatalogueMenu } from './reset-catalogue-menu';
import { SortableList } from '@/components/shared/sortable-list';

type CategoryRailProps = {
  catalogue: Catalogue;
  selectedId: string;
  onSelect: (categoryId: string) => void;
};

/** S2 left rail: categories with active-service counts, drag to reorder, archived ones folded away. */
export function CategoryRail({ catalogue, selectedId, onSelect }: CategoryRailProps) {
  const reorder = useReorderCategories();
  const active = catalogue.categories.filter((category) => !category.archivedAt);
  const archived = catalogue.categories.filter((category) => category.archivedAt);
  const ids = active.map((category) => category.id);

  return (
    <nav
      aria-label="Categories"
      className="flex flex-col gap-4 rounded-md border border-border bg-muted p-3"
    >
      <div className="flex items-center justify-between gap-2 px-1">
        <h2 className="text-overline text-muted-foreground">Categories</h2>
        <ResetCatalogueMenu canReset={catalogue.canReset} />
      </div>
      <SortableList
        ids={ids}
        nameOf={(id) => active.find((category) => category.id === id)?.name ?? 'category'}
        onMove={(id, overId) => {
          reorder.mutate(withArchivedLast(moveTo(ids, id, overId), catalogue.categories));
        }}
      >
        <ul className="flex flex-col gap-0.5">
          {active.map((category) => (
            <RailItem
              key={category.id}
              category={category}
              selected={category.id === selectedId}
              onSelect={onSelect}
            />
          ))}
        </ul>
      </SortableList>
      <AddCategoryDialog onCreated={onSelect} />
      {archived.length > 0 ? (
        <Collapsible className="flex flex-col gap-1">
          <CollapsibleTrigger className="group flex items-center gap-1 rounded-sm px-1 text-label text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
            <ChevronRight
              className="size-4 transition-transform duration-200 group-data-[state=open]:rotate-90"
              strokeWidth={1.5}
              aria-hidden="true"
            />
            Archived ({archived.length})
          </CollapsibleTrigger>
          <CollapsibleContent>
            <ul className="flex flex-col gap-0.5">
              {archived.map((category) => (
                <li key={category.id}>
                  <CategoryButton
                    category={category}
                    selected={category.id === selectedId}
                    onSelect={onSelect}
                  />
                </li>
              ))}
            </ul>
          </CollapsibleContent>
        </Collapsible>
      ) : null}
    </nav>
  );
}

type RailItemProps = {
  category: CatalogueCategory;
  selected: boolean;
  onSelect: (id: string) => void;
};

function RailItem({ category, selected, onSelect }: RailItemProps) {
  const { attachRow, attachHandle, handleProps, style, className, isDragging } = useSortableRow(
    category.id,
  );
  return (
    <li
      ref={attachRow}
      style={style}
      data-dragging={isDragging}
      className={cn('flex items-center gap-1 rounded-sm', className)}
    >
      <DragHandle label={`Reorder ${category.name}`} ref={attachHandle} {...handleProps} />
      <CategoryButton category={category} selected={selected} onSelect={onSelect} />
    </li>
  );
}

function CategoryButton({ category, selected, onSelect }: RailItemProps) {
  const count = category.services.filter((service) => !service.archivedAt).length;
  return (
    <button
      type="button"
      aria-current={selected ? 'true' : undefined}
      onClick={() => {
        onSelect(category.id);
      }}
      className={cn(
        'flex min-h-8 min-w-0 flex-1 items-center justify-between gap-2 rounded-sm border-l-3 px-2 py-1 text-left text-label transition-colors duration-200 hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        selected
          ? 'border-gold bg-gold-soft text-foreground'
          : 'border-transparent text-muted-foreground',
      )}
    >
      <span className="truncate" title={category.name}>
        {category.name}
      </span>
      <span className="shrink-0 tabular-nums" aria-hidden="true">
        {count}
      </span>
      <span className="sr-only">, {count === 1 ? '1 service' : `${count} services`}</span>
    </button>
  );
}

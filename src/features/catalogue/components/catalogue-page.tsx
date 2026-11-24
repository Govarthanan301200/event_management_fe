import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useCatalogue } from '../hooks/use-catalogue';
import { useSelectedCategory } from '../hooks/use-selected-category';
import { AddCategoryDialog } from './add-category-dialog';
import { CategoryPanel } from './category-panel';
import { CategoryRail } from './category-rail';
import { CategorySelect } from './category-select';

/** S2 Settings › Service catalogue (spec §8). */
export function CataloguePage() {
  const query = useCatalogue();
  const categories = query.data?.categories ?? [];
  const { selected, select } = useSelectedCategory(categories);

  if (query.isPending) return <CatalogueSkeleton />;
  if (query.isError) {
    return (
      <div role="alert" className="flex flex-col items-start gap-3 py-8">
        <p className="text-body text-danger">⚠ Couldn&apos;t load your catalogue.</p>
        <Button variant="outline" onClick={() => void query.refetch()}>
          Try again
        </Button>
      </div>
    );
  }
  if (!selected) {
    return (
      <div className="flex flex-col items-start gap-2 py-16">
        <h2 className="text-title-serif">Add your first category</h2>
        <p className="text-body text-muted-foreground">
          Categories group the services clients choose from, like Decor or Food and Beverage.
        </p>
        <AddCategoryDialog onCreated={select} />
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:items-start">
      <div className="hidden lg:block">
        <CategoryRail catalogue={query.data} selectedId={selected.id} onSelect={select} />
      </div>
      <CategorySelect
        id="category-switcher"
        label="Category"
        className="lg:hidden"
        categories={categories}
        value={selected.id}
        onChange={select}
      />
      {/* key: a different category starts with fresh dialog state. */}
      <CategoryPanel key={selected.id} category={selected} categories={categories} />
    </div>
  );
}

function CatalogueSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading catalogue"
      className="grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]"
    >
      <div className="hidden flex-col gap-2 lg:flex">
        {['a', 'b', 'c', 'd', 'e', 'f'].map((key) => (
          <Skeleton key={key} className="h-8 w-full" />
        ))}
      </div>
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-64 w-full rounded-md" />
      </div>
    </div>
  );
}

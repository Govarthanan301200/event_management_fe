import { Field, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { DirectoryScope } from '../hooks/use-directory-filter';
import type { CountedItem } from '../lib/directory';

type VendorScopeNavProps = {
  categories: CountedItem[];
  total: number;
  archived: number;
  scope: DirectoryScope;
  onAll: () => void;
  onCategory: (categoryId: string) => void;
  onArchived: () => void;
};

const scopeValue = (scope: DirectoryScope) =>
  scope.kind === 'category' ? scope.categoryId : scope.kind;

/**
 * S3 category list (spec §9): every active category with its vendor count. A vendor counts under
 * each category its services belong to (core rule 2). Below 1024px it becomes a Select.
 */
export function VendorScopeNav(props: VendorScopeNavProps) {
  return (
    <>
      <div className="hidden lg:block">
        <ScopeRail {...props} />
      </div>
      <ScopeSelect {...props} />
    </>
  );
}

function ScopeRail({
  categories,
  total,
  archived,
  scope,
  onAll,
  onCategory,
  onArchived,
}: VendorScopeNavProps) {
  return (
    <nav
      aria-label="Categories"
      className="flex flex-col gap-3 rounded-md border border-border bg-muted p-3"
    >
      <h2 className="px-1 text-overline text-muted-foreground">Categories</h2>
      <ul className="flex flex-col gap-0.5">
        <li>
          <ScopeButton
            name="All vendors"
            count={total}
            selected={scope.kind === 'all'}
            onSelect={onAll}
          />
        </li>
        {categories.map((category) => (
          <li key={category.id}>
            <ScopeButton
              name={category.name}
              count={category.count}
              selected={scope.kind === 'category' && scope.categoryId === category.id}
              onSelect={() => {
                onCategory(category.id);
              }}
            />
          </li>
        ))}
      </ul>
      {archived > 0 ? (
        <ScopeButton
          name="Archived"
          count={archived}
          selected={scope.kind === 'archived'}
          onSelect={onArchived}
        />
      ) : null}
    </nav>
  );
}

type ScopeButtonProps = { name: string; count: number; selected: boolean; onSelect: () => void };

function ScopeButton({ name, count, selected, onSelect }: ScopeButtonProps) {
  return (
    <button
      type="button"
      aria-current={selected ? 'true' : undefined}
      onClick={onSelect}
      className={cn(
        'flex min-h-8 w-full min-w-0 items-center justify-between gap-2 rounded-sm border-l-3 px-2 py-1 text-left text-label transition-colors duration-200 hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        selected
          ? 'border-gold bg-gold-soft text-foreground'
          : 'border-transparent text-muted-foreground',
        count === 0 && !selected && 'text-subtle-foreground',
      )}
    >
      <span className="truncate" title={name}>
        {name}
      </span>
      <span className="shrink-0 tabular-nums" aria-hidden="true">
        {count}
      </span>
      <span className="sr-only">, {count === 1 ? '1 vendor' : `${count} vendors`}</span>
    </button>
  );
}

function ScopeSelect({
  categories,
  total,
  archived,
  scope,
  onAll,
  onCategory,
  onArchived,
}: VendorScopeNavProps) {
  return (
    <Field className="lg:hidden">
      <FieldLabel htmlFor="vendor-scope">Category</FieldLabel>
      <Select
        value={scopeValue(scope)}
        onValueChange={(value) => {
          if (value === 'all') onAll();
          else if (value === 'archived') onArchived();
          else onCategory(value);
        }}
      >
        <SelectTrigger id="vendor-scope" className="h-10 w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper">
          <SelectItem value="all">All vendors ({total})</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              {category.name} ({category.count})
            </SelectItem>
          ))}
          {archived > 0 ? (
            <>
              <SelectSeparator />
              <SelectItem value="archived">Archived ({archived})</SelectItem>
            </>
          ) : null}
        </SelectContent>
      </Select>
    </Field>
  );
}

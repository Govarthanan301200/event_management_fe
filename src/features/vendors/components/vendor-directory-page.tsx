import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { catalogueOptions } from '@/features/catalogue';
import { useDirectoryFilter } from '../hooks/use-directory-filter';
import { useVendorFacets } from '../hooks/use-vendors';
import { categoryEntries, serviceChips } from '../lib/directory';
import { DirectoryEmpty } from './directory-empty';
import { ServiceFilterChips } from './service-filter-chips';
import { VendorList } from './vendor-list';
import { VendorScopeNav } from './vendor-scope-nav';
import { VendorSearch } from './vendor-search';

/** S3 Vendor directory (spec §9). */
export function VendorDirectoryPage() {
  const catalogue = useQuery(catalogueOptions());
  const facets = useVendorFacets();
  const directory = useDirectoryFilter();

  if (catalogue.isPending || facets.isPending) return <DirectorySkeleton />;
  if (catalogue.isError || facets.isError) {
    return (
      <div role="alert" className="flex flex-col items-start gap-3 py-8">
        <p className="text-body text-danger">⚠ Couldn&apos;t load vendors.</p>
        <Button
          variant="outline"
          onClick={() => {
            void catalogue.refetch();
            void facets.refetch();
          }}
        >
          Try again
        </Button>
      </div>
    );
  }

  if (facets.data.total === 0 && facets.data.archived === 0) return <FirstVendor />;

  const { scope } = directory;
  const categories = categoryEntries(catalogue.data, facets.data);
  const category =
    scope.kind === 'category'
      ? categories.find((entry) => entry.id === scope.categoryId)
      : undefined;
  const chips = category
    ? serviceChips(catalogue.data, facets.data, category.id, directory.serviceId)
    : [];
  const service = chips.find((chip) => chip.id === directory.serviceId);
  const title = scope.kind === 'archived' ? 'Archived vendors' : (category?.name ?? 'All vendors');

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-headline">Vendors</h1>
        <Button asChild className="h-10 px-4">
          <Link to="/vendors/new">
            <Plus strokeWidth={1.5} aria-hidden="true" />
            Add vendor
          </Link>
        </Button>
      </header>
      <div className="grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:items-start">
        <VendorScopeNav
          categories={categories}
          total={facets.data.total}
          archived={facets.data.archived}
          scope={scope}
          onAll={directory.selectAll}
          onCategory={directory.selectCategory}
          onArchived={directory.selectArchived}
        />
        <section aria-labelledby="directory-title" className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="directory-title" className="text-heading">
              {title}
            </h2>
            <VendorSearch value={directory.q} onSearch={directory.setSearch} />
          </div>
          {category ? (
            <ServiceFilterChips
              total={category.count}
              chips={chips}
              selectedId={directory.serviceId}
              onSelect={directory.selectService}
            />
          ) : null}
          <VendorList
            filter={directory.filter}
            from={directory.search}
            empty={
              <DirectoryEmpty
                search={directory.filter.q}
                serviceName={service?.name}
                serviceId={service?.id}
                categoryName={category?.name}
                archived={scope.kind === 'archived'}
                onClearSearch={() => {
                  directory.setSearch('');
                }}
              />
            }
          />
        </section>
      </div>
    </div>
  );
}

function FirstVendor() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-headline">Vendors</h1>
      <div className="flex flex-col items-start gap-2 py-12">
        <h2 className="text-title-serif">Add your first vendor</h2>
        <p className="max-w-prose text-body text-muted-foreground">
          Keep the caterers, decorators and photographers you book, linked to the exact services
          they offer. You&apos;ll pick from them when you plan an event.
        </p>
        <Button asChild className="mt-2 h-10 px-4">
          <Link to="/vendors/new">
            <Plus strokeWidth={1.5} aria-hidden="true" />
            Add vendor
          </Link>
        </Button>
      </div>
    </div>
  );
}

function DirectorySkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading vendors" className="flex flex-col gap-6">
      <Skeleton className="h-9 w-40" />
      <div className="grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <div className="hidden flex-col gap-2 lg:flex">
          {['a', 'b', 'c', 'd', 'e', 'f'].map((key) => (
            <Skeleton key={key} className="h-8 w-full" />
          ))}
        </div>
        <div className="flex flex-col gap-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full rounded-md" />
        </div>
      </div>
    </div>
  );
}

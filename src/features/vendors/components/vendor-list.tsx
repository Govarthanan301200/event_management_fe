import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { DirectoryFilter } from '../api/vendors.api';
import type { VendorSummary } from '../api/vendors.schema';
import { useVendorList } from '../hooks/use-vendors';
import { orderedTags } from '../lib/directory';
import { PhoneLink } from './phone-link';

type VendorListProps = {
  filter: DirectoryFilter;
  /** The query string of the current view, carried to the profile for its Back link. */
  from: string;
  /** What to show when nothing matches the filter. */
  empty: ReactNode;
};

const MAX_TAGS = 3;

/** S3 rows (spec §9): name, contact, city and service tags; paged by name with Load more. */
export function VendorList({ filter, from, empty }: VendorListProps) {
  const query = useVendorList(filter);

  if (query.isPending) return <VendorListSkeleton />;
  if (query.isError) {
    return (
      <div role="alert" className="flex flex-col items-start gap-3 py-8">
        <p className="text-body text-danger">⚠ Couldn&apos;t load vendors.</p>
        <Button variant="outline" onClick={() => void query.refetch()}>
          Try again
        </Button>
      </div>
    );
  }
  const vendors = query.data.pages.flatMap((page) => page.data);
  if (vendors.length === 0) return <>{empty}</>;

  return (
    <div className="flex flex-col gap-4">
      <div
        aria-busy={query.isPlaceholderData ? true : undefined}
        className={cn(
          'rounded-md border border-border bg-card transition-opacity duration-200',
          query.isPlaceholderData && 'opacity-60',
        )}
      >
        <Table>
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead className="text-label text-muted-foreground">Name</TableHead>
              <TableHead className="hidden text-label text-muted-foreground md:table-cell">
                Contact
              </TableHead>
              <TableHead className="hidden text-label text-muted-foreground sm:table-cell">
                City
              </TableHead>
              <TableHead className="hidden text-label text-muted-foreground sm:table-cell">
                Services
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vendors.map((vendor) => (
              <VendorRow
                key={vendor.id}
                vendor={vendor}
                categoryId={filter.categoryId}
                from={from}
              />
            ))}
          </TableBody>
        </Table>
      </div>
      {query.hasNextPage ? (
        <Button
          variant="outline"
          className="self-center"
          disabled={query.isFetchingNextPage}
          onClick={() => void query.fetchNextPage()}
        >
          {query.isFetchingNextPage ? 'Loading…' : 'Load more'}
        </Button>
      ) : null}
    </div>
  );
}

type VendorRowProps = { vendor: VendorSummary; categoryId: string | undefined; from: string };

function VendorRow({ vendor, categoryId, from }: VendorRowProps) {
  const tags = orderedTags(vendor.services, categoryId);
  return (
    <TableRow>
      <TableCell className="max-w-0 align-top whitespace-normal">
        <div className="flex min-w-0 flex-col gap-0.5">
          <Link
            to={`/vendors/${vendor.id}`}
            state={{ from }}
            className="truncate text-body font-semibold underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            title={vendor.name}
          >
            {vendor.name}
          </Link>
          {/* Below md the contact and city stack under the name. */}
          <span className="truncate text-caption text-muted-foreground md:hidden">
            {[vendor.contactPerson, vendor.city].filter(Boolean).join(' · ')}
          </span>
          <ServiceTags tags={tags} className="sm:hidden" />
        </div>
      </TableCell>
      <TableCell className="hidden align-top md:table-cell">
        <div className="flex flex-col gap-0.5">
          {vendor.contactPerson ? <span className="text-body">{vendor.contactPerson}</span> : null}
          <PhoneLink phone={vendor.phone} className="text-caption" />
        </div>
      </TableCell>
      <TableCell className="hidden align-top text-body sm:table-cell">
        {vendor.city ?? <span className="text-subtle-foreground">—</span>}
      </TableCell>
      <TableCell className="hidden align-top sm:table-cell">
        <ServiceTags tags={tags} />
      </TableCell>
    </TableRow>
  );
}

type ServiceTagsProps = { tags: VendorSummary['services']; className?: string };

function ServiceTags({ tags, className }: ServiceTagsProps) {
  const shown = tags.slice(0, MAX_TAGS);
  const hidden = tags.slice(MAX_TAGS);
  return (
    <ul aria-label="Services" className={cn('flex flex-wrap gap-1', className)}>
      {shown.map((tag) => (
        <li key={tag.id}>
          <Badge
            variant="outline"
            className="rounded-sm text-caption font-medium text-muted-foreground"
          >
            {tag.name}
          </Badge>
        </li>
      ))}
      {hidden.length > 0 ? (
        <li>
          <Badge
            variant="outline"
            className="rounded-sm text-caption text-muted-foreground"
            title={hidden.map((tag) => tag.name).join(', ')}
          >
            +{hidden.length}
            <span className="sr-only"> more: {hidden.map((tag) => tag.name).join(', ')}</span>
          </Badge>
        </li>
      ) : null}
    </ul>
  );
}

function VendorListSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading vendors" className="flex flex-col gap-2">
      {['a', 'b', 'c', 'd', 'e'].map((key) => (
        <Skeleton key={key} className="h-14 w-full" />
      ))}
    </div>
  );
}

import { ArrowLeft } from 'lucide-react';
import { Link, useParams } from 'react-router';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiError } from '@/lib/api-client';
import { useDirectoryOrigin } from '../hooks/use-directory-origin';
import { useUpdateVendor, useVendor } from '../hooks/use-vendors';
import { VendorActionsMenu } from './vendor-actions-menu';
import {
  BasicInfoSection,
  NotesSection,
  ServicesSection,
  TeamSection,
} from './vendor-profile-sections';

/** S4 Vendor profile (spec §9): basic information, team, services and rates, planner notes. */
export function VendorProfilePage() {
  const { vendorId = '' } = useParams();
  const query = useVendor(vendorId);
  const origin = useDirectoryOrigin();

  if (query.isPending) return <ProfileSkeleton />;
  if (query.isError) {
    const missing = query.error instanceof ApiError && query.error.status === 404;
    return (
      <div role="alert" className="flex flex-col items-start gap-3 py-8">
        <p className="text-body text-danger">
          {missing ? '⚠ This vendor doesn’t exist or was deleted.' : '⚠ Couldn’t load this vendor.'}
        </p>
        {missing ? (
          <Button asChild variant="outline">
            <Link to="/vendors">Back to vendors</Link>
          </Button>
        ) : (
          <Button variant="outline" onClick={() => void query.refetch()}>
            Try again
          </Button>
        )}
      </div>
    );
  }

  const vendor = query.data;
  const used =
    vendor.usedInEvents > 0
      ? `Used in ${vendor.usedInEvents} ${vendor.usedInEvents === 1 ? 'event' : 'events'}`
      : null;
  const subtitle = [
    vendor.categories.map((category) => category.name).join(', '),
    vendor.city,
    used,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <article className="flex flex-col gap-6">
      <Link
        to={origin.href}
        className="inline-flex w-fit items-center gap-1 text-label text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <ArrowLeft className="size-4" strokeWidth={1.5} aria-hidden="true" />
        Vendors
      </Link>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-headline font-display break-words">{vendor.name}</h1>
          {subtitle ? <p className="text-body text-muted-foreground">{subtitle}</p> : null}
        </div>
        <div className="flex items-center gap-2">
          <Button asChild className="h-10 px-4">
            <Link to={`/vendors/${vendor.id}/edit`} state={{ from: origin.from }}>
              Edit
            </Link>
          </Button>
          <VendorActionsMenu vendor={vendor} />
        </div>
      </header>
      {vendor.archivedAt ? <ArchivedBanner vendorId={vendor.id} /> : null}
      <div className="flex flex-col gap-4">
        <BasicInfoSection vendor={vendor} />
        <TeamSection contacts={vendor.contacts} />
        <ServicesSection vendor={vendor} />
        <NotesSection notes={vendor.notes} />
      </div>
    </article>
  );
}

type ArchivedBannerProps = { vendorId: string };

function ArchivedBanner({ vendorId }: ArchivedBannerProps) {
  const update = useUpdateVendor();
  return (
    <div
      role="status"
      className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-muted px-4 py-3"
    >
      <p className="text-body text-muted-foreground">
        Archived. This vendor is hidden from the directory and from vendor pickers.
      </p>
      <Button
        variant="outline"
        disabled={update.isPending}
        onClick={() => {
          update.mutate({ id: vendorId, change: { archived: false } });
        }}
      >
        {update.isPending ? 'Restoring…' : 'Restore'}
      </Button>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading vendor" className="flex flex-col gap-6">
      <Skeleton className="h-5 w-24" />
      <Skeleton className="h-9 w-72" />
      {['a', 'b', 'c'].map((key) => (
        <Skeleton key={key} className="h-32 w-full rounded-md" />
      ))}
    </div>
  );
}

import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';

type DirectoryEmptyProps = {
  search: string | undefined;
  serviceName: string | undefined;
  serviceId: string | undefined;
  categoryName: string | undefined;
  archived: boolean;
  onClearSearch: () => void;
};

/** S3 empty states: a search with no match, a service or category with no vendors yet, no archive. */
export function DirectoryEmpty({
  search,
  serviceName,
  serviceId,
  categoryName,
  archived,
  onClearSearch,
}: DirectoryEmptyProps) {
  if (search) {
    return (
      <EmptyState
        title={`No vendors match “${search}”`}
        body="Try a name, a city or part of a phone number."
      >
        <Button variant="outline" onClick={onClearSearch}>
          Clear search
        </Button>
      </EmptyState>
    );
  }
  if (archived) {
    return <EmptyState title="No archived vendors" body="Vendors you archive are kept here." />;
  }
  if (serviceName && serviceId) {
    return (
      <EmptyState
        title={`No vendors offer ${serviceName} yet`}
        body="Add one and they'll appear here and in the vendor picker for this service."
      >
        <Button asChild variant="outline">
          <Link to={`/vendors/new?service=${encodeURIComponent(serviceId)}`}>Add vendor</Link>
        </Button>
      </EmptyState>
    );
  }
  return (
    <EmptyState
      title={categoryName ? `No vendors in ${categoryName} yet` : 'No vendors yet'}
      body="A vendor appears under every category its services belong to."
    />
  );
}

type EmptyStateProps = { title: string; body: string; children?: ReactNode };

function EmptyState({ title, body, children }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-start gap-2 rounded-md border border-dashed border-border px-6 py-10">
      <h3 className="text-title-serif">{title}</h3>
      <p className="text-body text-muted-foreground">{body}</p>
      {children ? <div className="mt-2">{children}</div> : null}
    </div>
  );
}

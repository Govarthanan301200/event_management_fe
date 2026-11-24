import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { catalogueOptions, type Catalogue } from '@/features/catalogue';
import type { VendorDetail } from '../api/vendors.schema';
import { useDirectoryOrigin } from '../hooks/use-directory-origin';
import { useCreateVendor, useUpdateVendor, useVendor } from '../hooks/use-vendors';
import { emptyVendorForm, toFormValues, toVendorInput } from '../lib/vendor-form';
import { VendorForm } from './vendor-form';

/** S4 Add vendor (`/vendors/new`, optionally `?service=` to pre-select one). */
export function NewVendorPage() {
  const catalogue = useQuery(catalogueOptions());
  const [params] = useSearchParams();
  const origin = useDirectoryOrigin();
  const navigate = useNavigate();
  const create = useCreateVendor();

  if (catalogue.isPending) return <FormSkeleton />;
  if (catalogue.isError) return <LoadError onRetry={() => void catalogue.refetch()} />;
  const preselect = pickableServiceId(catalogue.data, params.get('service'));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-headline">Add vendor</h1>
      <VendorForm
        catalogue={catalogue.data}
        defaultValues={emptyVendorForm(preselect)}
        submitLabel="Save vendor"
        pending={create.isPending}
        error={create.error}
        onCancel={() => void navigate(origin.href)}
        onSubmit={(values) => {
          create.mutate(toVendorInput(values), {
            onSuccess: (vendor) => {
              toast.success(`Saved ${vendor.name}`);
              void navigate(`/vendors/${vendor.id}`, {
                replace: true,
                state: { from: origin.from },
              });
            },
          });
        }}
      />
    </div>
  );
}

/** S4 Edit (`/vendors/:vendorId/edit`). */
export function EditVendorPage() {
  const { vendorId = '' } = useParams();
  const catalogue = useQuery(catalogueOptions());
  const vendor = useVendor(vendorId);

  if (catalogue.isPending || vendor.isPending) return <FormSkeleton />;
  if (catalogue.isError || vendor.isError) {
    return (
      <LoadError
        onRetry={() => {
          void catalogue.refetch();
          void vendor.refetch();
        }}
      />
    );
  }
  // key: a refetched vendor starts a fresh form rather than mixing old and new values.
  return <EditVendorForm key={vendor.data.id} catalogue={catalogue.data} vendor={vendor.data} />;
}

type EditVendorFormProps = { catalogue: Catalogue; vendor: VendorDetail };

function EditVendorForm({ catalogue, vendor }: EditVendorFormProps) {
  const origin = useDirectoryOrigin();
  const navigate = useNavigate();
  const update = useUpdateVendor();
  const profile = { pathname: `/vendors/${vendor.id}` };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <p className="text-label text-muted-foreground">Edit vendor</p>
        <h1 className="text-headline font-display break-words">{vendor.name}</h1>
      </div>
      <VendorForm
        catalogue={catalogue}
        vendorId={vendor.id}
        defaultValues={toFormValues(vendor)}
        submitLabel="Save changes"
        pending={update.isPending}
        error={update.error}
        onCancel={() => void navigate(profile, { state: { from: origin.from } })}
        onSubmit={(values) => {
          update.mutate(
            { id: vendor.id, change: toVendorInput(values) },
            {
              onSuccess: (saved) => {
                toast.success(`Saved ${saved.name}`);
                void navigate(profile, { replace: true, state: { from: origin.from } });
              },
            },
          );
        }}
      />
    </div>
  );
}

/** Only an active, existing service can be pre-selected from the URL. */
function pickableServiceId(catalogue: Catalogue, serviceId: string | null): string | null {
  if (!serviceId) return null;
  const found = catalogue.categories.some(
    (category) =>
      !category.archivedAt &&
      category.services.some((service) => service.id === serviceId && !service.archivedAt),
  );
  return found ? serviceId : null;
}

type LoadErrorProps = { onRetry: () => void };

function LoadError({ onRetry }: LoadErrorProps) {
  return (
    <div role="alert" className="flex flex-col items-start gap-3 py-8">
      <p className="text-body text-danger">⚠ Couldn&apos;t load the form.</p>
      <Button variant="outline" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}

function FormSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading form" className="flex flex-col gap-4">
      <Skeleton className="h-9 w-56" />
      {['a', 'b', 'c'].map((key) => (
        <Skeleton key={key} className="h-48 w-full rounded-md" />
      ))}
    </div>
  );
}

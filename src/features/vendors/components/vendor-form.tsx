import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import type { Catalogue } from '@/features/catalogue';
import { errorMessage } from '@/lib/api-client';
import { vendorFormSchema, type VendorForm as VendorFormValues } from '../api/vendors.schema';
import { FormSection } from './form-section';
import { FormTextField } from './form-text-field';
import { VendorBasicFields } from './vendor-basic-fields';
import { VendorContactsFields } from './vendor-contacts-fields';
import { VendorServicesFields } from './vendor-services-fields';

type VendorFormProps = {
  catalogue: Catalogue;
  defaultValues: VendorFormValues;
  /** The vendor being edited; absent when adding. */
  vendorId?: string | undefined;
  submitLabel: string;
  pending: boolean;
  error: Error | null;
  onSubmit: (values: VendorFormValues) => void;
  onCancel: () => void;
};

/** S4 edit form (spec §9): the four parts, then a sticky Cancel / Save bar. */
export function VendorForm({
  catalogue,
  defaultValues,
  vendorId,
  submitLabel,
  pending,
  error,
  onSubmit,
  onCancel,
}: VendorFormProps) {
  const form = useForm<VendorFormValues>({
    resolver: zodResolver(vendorFormSchema),
    defaultValues,
    // Errors appear on submit, then update as the planner fixes them.
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  });

  return (
    <FormProvider {...form}>
      <form
        noValidate
        onSubmit={(event) => void form.handleSubmit(onSubmit)(event)}
        // The sticky bar must never cover the focused field (design system: scroll padding).
        className="flex scroll-pb-24 flex-col gap-4 pb-24"
      >
        <VendorBasicFields vendorId={vendorId} />
        <VendorContactsFields />
        <VendorServicesFields catalogue={catalogue} />
        <FormSection title="Planner notes" description="Private. Clients never see this.">
          <FormTextField
            name="notes"
            label="Notes"
            multiline
            placeholder="Reliable, brings own sound. Confirm generator for outdoor venues."
          />
        </FormSection>
        <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center justify-end gap-3 border-t border-border bg-card px-4 py-3 shadow-sticky sm:-mx-8 sm:px-8">
          {error ? (
            <p role="alert" className="mr-auto text-label text-danger">
              ⚠ {errorMessage(error, "Couldn't save the vendor. Try again.")}
            </p>
          ) : null}
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending} className="h-10 px-4">
            {pending ? 'Saving…' : submitLabel}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}

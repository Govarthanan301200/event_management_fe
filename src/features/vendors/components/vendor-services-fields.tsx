import { ListChecks } from 'lucide-react';
import { useState } from 'react';
import { useFieldArray, useFormContext, useFormState } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import type { Catalogue } from '@/features/catalogue';
import type { VendorForm } from '../api/vendors.schema';
import { indexCatalogue, pickableCategories, type IndexedService } from '../lib/catalogue-index';
import { applyServiceSelection } from '../lib/vendor-form';
import { FormSection } from './form-section';
import { ServicePickerDialog } from './service-picker-dialog';
import { ServiceRateRow } from './service-rate-row';

type VendorServicesFieldsProps = { catalogue: Catalogue };

type Group = {
  categoryId: string;
  categoryName: string;
  rows: { index: number; fieldId: string; service: IndexedService | undefined }[];
};

/** Spec §9 part 3: services offered (at least one), each with an optional rate. */
export function VendorServicesFields({ catalogue }: VendorServicesFieldsProps) {
  const [picking, setPicking] = useState(false);
  const { control, getValues } = useFormContext<VendorForm>();
  const services = useFieldArray({ control, name: 'services' });
  const { errors } = useFormState({ control, name: 'services' });
  const listError = errors.services?.root?.message ?? errors.services?.message;
  const index = indexCatalogue(catalogue);

  // Rows grouped by category, in catalogue order (applyServiceSelection keeps them sorted).
  const groups: Group[] = [];
  services.fields.forEach((field, position) => {
    const service = index.get(field.serviceId);
    const categoryId = service?.categoryId ?? 'unknown';
    let group = groups.at(-1);
    if (group?.categoryId !== categoryId) {
      group = { categoryId, categoryName: service?.categoryName ?? 'Other', rows: [] };
      groups.push(group);
    }
    group.rows.push({ index: position, fieldId: field.id, service });
  });

  const chooseButton = (
    <Button
      type="button"
      variant="outline"
      onClick={() => {
        setPicking(true);
      }}
    >
      <ListChecks strokeWidth={1.5} aria-hidden="true" />
      {services.fields.length === 0 ? 'Choose services' : 'Change services'}
    </Button>
  );

  return (
    <FormSection
      title="Services offered"
      description="At least one. Rates are optional and only ever suggest a budget."
      action={chooseButton}
    >
      {services.fields.length === 0 ? (
        <p className="text-body text-muted-foreground">
          No services yet. Choose the exact services this vendor offers, from any category.
        </p>
      ) : (
        <div className="flex flex-col gap-5">
          {groups.map((group) => (
            <div key={group.categoryId} className="flex flex-col gap-3">
              <h3 className="text-overline text-muted-foreground">{group.categoryName}</h3>
              <ul className="flex flex-col gap-4">
                {group.rows.map((row) => (
                  <ServiceRateRow
                    key={row.fieldId}
                    index={row.index}
                    name={row.service?.name ?? 'Unknown service'}
                    archived={row.service?.archived ?? false}
                    onRemove={() => {
                      services.remove(row.index);
                    }}
                  />
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
      {listError ? (
        <p id="vendor-services-error" role="alert" className="mt-3 text-label text-danger">
          ⚠ {listError}
        </p>
      ) : null}
      <ServicePickerDialog
        open={picking}
        onOpenChange={setPicking}
        categories={pickableCategories(catalogue)}
        selected={new Set(services.fields.map((field) => field.serviceId))}
        onApply={(selected) => {
          services.replace(applyServiceSelection(getValues('services'), selected, index));
          setPicking(false);
        }}
      />
    </FormSection>
  );
}

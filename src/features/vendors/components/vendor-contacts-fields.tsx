import { Plus, Trash2 } from 'lucide-react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import type { VendorForm } from '../api/vendors.schema';
import { FormSection } from './form-section';
import { FormTextField } from './form-text-field';

const MAX_CONTACTS = 20;

/** Spec §9 part 2: team contacts (name, role, phone), any number, for one-tap calls on the day. */
export function VendorContactsFields() {
  const { control } = useFormContext<VendorForm>();
  const contacts = useFieldArray({ control, name: 'contacts' });

  const addButton = (
    <Button
      type="button"
      variant="outline"
      disabled={contacts.fields.length >= MAX_CONTACTS}
      onClick={() => {
        contacts.append(
          { name: '', role: '', phone: '' },
          { focusName: `contacts.${contacts.fields.length}.name` },
        );
      }}
    >
      <Plus strokeWidth={1.5} aria-hidden="true" />
      Add contact
    </Button>
  );

  return (
    <FormSection
      title="Team contacts"
      description="Optional. Used for one-tap calls on the day."
      action={addButton}
    >
      {contacts.fields.length === 0 ? (
        <p className="text-body text-muted-foreground">No team contacts yet.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {contacts.fields.map((field, index) => (
            <li
              key={field.id}
              className="grid items-start gap-3 border-b border-border pb-4 last:border-b-0 last:pb-0 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]"
            >
              <FormTextField
                name={`contacts.${index}.name`}
                label="Name"
                accessibleName={`Name of contact ${index + 1}`}
              />
              <FormTextField
                name={`contacts.${index}.role`}
                label="Role"
                accessibleName={`Role of contact ${index + 1}`}
                placeholder="Lead DJ"
              />
              <FormTextField
                name={`contacts.${index}.phone`}
                label="Phone"
                accessibleName={`Phone of contact ${index + 1}`}
                type="tel"
                inputMode="tel"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="mt-0 sm:mt-6"
                aria-label={`Remove contact ${index + 1}`}
                onClick={() => {
                  contacts.remove(index);
                }}
              >
                <Trash2 strokeWidth={1.5} aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </FormSection>
  );
}

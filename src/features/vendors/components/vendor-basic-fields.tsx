import { useFormContext } from 'react-hook-form';
import { Link } from 'react-router';
import { vendorFormSchema, type PhoneMatch, type VendorForm } from '../api/vendors.schema';
import { usePhoneCheck } from '../hooks/use-vendors';
import { FormTextField } from './form-text-field';
import { FormSection } from './form-section';

type VendorBasicFieldsProps = {
  /** The vendor being edited, so their own number doesn't warn. */
  vendorId?: string | undefined;
};

/** Spec §9 part 1: basic information (required: name and phone). */
export function VendorBasicFields({ vendorId }: VendorBasicFieldsProps) {
  const { getValues } = useFormContext<VendorForm>();
  const phoneCheck = usePhoneCheck(vendorId);

  return (
    <FormSection title="Basic information" description="Only the name and phone are required.">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormTextField name="name" label="Vendor name" className="sm:col-span-2" />
        <FormTextField name="contactPerson" label="Point of contact" />
        <div className="flex flex-col gap-2">
          <FormTextField
            name="phone"
            label="Phone"
            type="tel"
            inputMode="tel"
            placeholder="+91 98400 12345"
            onBlur={() => {
              const phone = getValues('phone');
              // Only well-formed numbers are checked; the field shows its own error otherwise.
              if (vendorFormSchema.shape.phone.safeParse(phone).success)
                phoneCheck.mutate(phone.trim());
              else phoneCheck.reset();
            }}
          />
          {phoneCheck.data && phoneCheck.data.length > 0 ? (
            <DuplicatePhoneWarning matches={phoneCheck.data} />
          ) : null}
        </div>
        <FormTextField name="altPhone" label="Alternate phone" type="tel" inputMode="tel" />
        <FormTextField name="city" label="City" />
        <FormTextField name="address" label="Full address" multiline className="sm:col-span-2" />
        <FormTextField
          name="portfolioUrl"
          label="Portfolio link"
          type="url"
          inputMode="url"
          placeholder="https://instagram.com/…"
          className="sm:col-span-2"
        />
      </div>
    </FormSection>
  );
}

type DuplicatePhoneWarningProps = { matches: PhoneMatch[] };

/**
 * Decision 2026-11-24: warn, never block. The profile opens in a new tab so this form isn't lost.
 */
function DuplicatePhoneWarning({ matches }: DuplicatePhoneWarningProps) {
  const [first] = matches;
  if (!first) return null;
  return (
    <p role="status" className="rounded-sm bg-warning-soft px-3 py-2 text-label text-foreground">
      <span className="font-semibold text-warning">Already saved · </span>
      That phone number is already saved for {first.name}
      {first.archived ? ' (archived)' : ''}
      {matches.length > 1 ? ` and ${matches.length - 1} more` : ''}.{' '}
      <Link
        to={`/vendors/${first.id}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Open their profile? (opens in a new tab)"
        className="text-gold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        Open their profile?
      </Link>{' '}
      You can still save.
    </p>
  );
}

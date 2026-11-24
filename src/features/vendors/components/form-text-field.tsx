import type { ReactNode } from 'react';
import { get, useFormContext, useFormState, type FieldPath } from 'react-hook-form';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { VendorForm } from '../api/vendors.schema';

type FormTextFieldProps = {
  name: FieldPath<VendorForm>;
  label: string;
  /**
   * Accessible name when several rows share a visible label ("Rate (₹) for DJ / VDJ"). It must
   * start with the visible label (WCAG 2.5.3 Label in Name).
   */
  accessibleName?: string | undefined;
  description?: ReactNode;
  multiline?: boolean;
  type?: 'text' | 'tel' | 'url';
  placeholder?: string;
  autoComplete?: string;
  inputMode?: 'text' | 'tel' | 'url' | 'numeric';
  className?: string;
  inputClassName?: string;
  onBlur?: () => void;
};

/** A labelled input bound to the vendor form, with its error linked via aria-describedby. */
export function FormTextField({
  name,
  label,
  accessibleName,
  description,
  multiline = false,
  type = 'text',
  placeholder,
  autoComplete = 'off',
  inputMode,
  className,
  inputClassName,
  onBlur,
}: FormTextFieldProps) {
  const { register } = useFormContext<VendorForm>();
  const { errors } = useFormState<VendorForm>({ name });
  const error: unknown = get(errors, name);
  const message =
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'
      ? error.message
      : undefined;
  const id = `vendor-${name.replace(/\./g, '-')}`;
  const describedBy = [description ? `${id}-help` : null, message ? `${id}-error` : null]
    .filter(Boolean)
    .join(' ');
  const registration = register(name, {
    ...(onBlur ? { onBlur } : {}),
  });
  const shared = {
    id,
    placeholder,
    'aria-label': accessibleName,
    'aria-invalid': message ? true : undefined,
    'aria-describedby': describedBy || undefined,
    ...registration,
  };

  return (
    <Field data-invalid={message ? true : undefined} className={className}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      {multiline ? (
        <Textarea rows={3} className={cn('min-h-20', inputClassName)} {...shared} />
      ) : (
        <Input
          type={type}
          autoComplete={autoComplete}
          inputMode={inputMode}
          className={cn('h-10', inputClassName)}
          {...shared}
        />
      )}
      {description ? <FieldDescription id={`${id}-help`}>{description}</FieldDescription> : null}
      {message ? <FieldError id={`${id}-error`}>{message}</FieldError> : null}
    </Field>
  );
}

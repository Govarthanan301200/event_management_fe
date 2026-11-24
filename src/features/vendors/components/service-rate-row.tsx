import { X } from 'lucide-react';
import { Controller, get, useFormContext, useFormState } from 'react-hook-form';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RATE_BASES, RATE_BASIS_LABEL, type VendorForm } from '../api/vendors.schema';
import { FormTextField } from './form-text-field';

type ServiceRateRowProps = {
  index: number;
  name: string;
  /** The service was archived after it was linked: the link stays, marked (decision 2026-11-24). */
  archived: boolean;
  onRemove: () => void;
};

const NOT_SET = 'none';

/** One offered service: optional rate amount, what it is per, and a note ("Min 3 hrs"). */
export function ServiceRateRow({ index, name, archived, onRemove }: ServiceRateRowProps) {
  const { control } = useFormContext<VendorForm>();
  const basisName = `services.${index}.rateBasis` as const;
  const { errors } = useFormState({ control, name: basisName });
  const basisError: unknown = get(errors, basisName);
  const basisMessage =
    typeof basisError === 'object' &&
    basisError !== null &&
    'message' in basisError &&
    typeof basisError.message === 'string'
      ? basisError.message
      : undefined;
  const basisId = `vendor-services-${index}-rateBasis`;

  return (
    <li className="grid items-start gap-3 border-b border-border pb-4 last:border-b-0 last:pb-0 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)_auto]">
      <div className="flex min-w-0 flex-col gap-1 md:pt-7">
        <span className="flex flex-wrap items-center gap-2 text-body font-semibold">
          {name}
          {archived ? (
            <Badge variant="outline" className="rounded-sm text-caption text-muted-foreground">
              Archived
            </Badge>
          ) : null}
        </span>
      </div>
      <FormTextField
        name={`services.${index}.rateAmount`}
        label="Rate (₹)"
        accessibleName={`Rate (₹) for ${name}`}
        inputMode="numeric"
        placeholder="Optional"
        inputClassName="text-right tabular-nums"
      />
      <Field data-invalid={basisMessage ? true : undefined}>
        <FieldLabel htmlFor={basisId}>Per</FieldLabel>
        <Controller
          control={control}
          name={basisName}
          render={({ field }) => (
            <Select
              value={field.value === '' ? NOT_SET : field.value}
              onValueChange={(value) => {
                field.onChange(value === NOT_SET ? '' : value);
              }}
            >
              <SelectTrigger
                id={basisId}
                aria-label={`Per for ${name}`}
                className="h-10 w-full"
                aria-invalid={basisMessage ? true : undefined}
                aria-describedby={basisMessage ? `${basisId}-error` : undefined}
                onBlur={field.onBlur}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value={NOT_SET}>Not set</SelectItem>
                <SelectSeparator />
                {RATE_BASES.map((basis) => (
                  <SelectItem key={basis} value={basis}>
                    {RATE_BASIS_LABEL[basis]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {basisMessage ? <FieldError id={`${basisId}-error`}>{basisMessage}</FieldError> : null}
      </Field>
      <FormTextField
        name={`services.${index}.rateNote`}
        label="Note"
        accessibleName={`Note for ${name}`}
        placeholder="Min 3 hrs"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="md:mt-6"
        aria-label={`Remove ${name}`}
        onClick={onRemove}
      >
        <X strokeWidth={1.5} aria-hidden="true" />
      </Button>
    </li>
  );
}

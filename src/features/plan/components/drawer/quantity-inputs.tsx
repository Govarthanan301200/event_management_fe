import type { FieldError, FieldErrorsImpl, Merge, Path, UseFormRegister } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import type { LineForm, QuantityForm } from '../../lib/line-form';
import type { ParameterKey } from '../../lib/quantities';
import { Tag } from '../tag';

type QuantityErrors = Merge<FieldError, FieldErrorsImpl<QuantityForm>>;

type QuantityInputsProps = {
  register: UseFormRegister<LineForm>;
  /** Field path inside the form, e.g. "rows.<functionId>" or "same". */
  prefix: string;
  /** For accessible names: "Sangeet", or "Same for all". */
  rowLabel: string;
  parameters: readonly ParameterKey[];
  values: QuantityForm;
  errors: QuantityErrors | undefined;
  /** Pax pre-filled from guests ("(guests)") or changed ("edited"). */
  paxHint?: 'guests' | 'edited' | null;
};

const UNIT = { pax: 'pax', hours: 'hrs', minutes: 'min' } as const;

/** One table cell per parameter, with the spec §4 inputs (size: length × width per label). */
export function QuantityInputs({
  register,
  prefix,
  rowLabel,
  parameters,
  values,
  errors,
  paxHint,
}: QuantityInputsProps) {
  // why: the prefix is one of the form's own row paths, so every built path exists in LineForm.
  const path = (field: string) => `${prefix}.${field}` as Path<LineForm>;
  const error = (message: string | undefined) =>
    message ? <span className="text-caption text-danger">⚠ {message}</span> : null;

  return (
    <>
      {parameters.map((key) => {
        if (key === 'size') {
          return (
            <td key={key} className="px-2 py-1.5 align-top">
              <div className="flex flex-col gap-1">
                {values.size.map((m, index) => (
                  <div key={m.label} className="flex flex-col gap-0.5">
                    <span className="flex items-center gap-1 text-caption text-muted-foreground">
                      <span className="w-12 truncate" title={m.label}>
                        {m.label}
                      </span>
                      <Input
                        inputMode="decimal"
                        aria-label={`${m.label} length in feet for ${rowLabel}`}
                        className="h-8 w-14 px-2 tabular-nums"
                        {...register(path(`size.${index}.length`))}
                      />
                      ×
                      <Input
                        inputMode="decimal"
                        aria-label={`${m.label} width in feet for ${rowLabel}`}
                        className="h-8 w-14 px-2 tabular-nums"
                        {...register(path(`size.${index}.width`))}
                      />
                      ft
                    </span>
                    {error(errors?.size?.[index]?.length?.message)}
                  </div>
                ))}
              </div>
            </td>
          );
        }
        if (key === 'work') {
          return (
            <td key={key} className="px-2 py-1.5 align-top">
              <Input
                aria-label={`Work for ${rowLabel}`}
                maxLength={500}
                className="h-8 min-w-40"
                {...register(path('work'))}
              />
            </td>
          );
        }
        const label = key === 'pax' ? 'Pax' : key === 'hours' ? 'Hours' : 'Minutes';
        return (
          <td key={key} className="px-2 py-1.5 align-top">
            <span className="flex items-center gap-1 text-caption text-muted-foreground">
              <Input
                inputMode={key === 'hours' ? 'decimal' : 'numeric'}
                aria-label={`${label} for ${rowLabel}`}
                aria-invalid={errors?.[key] ? true : undefined}
                className="h-8 w-20 px-2 tabular-nums"
                {...register(path(key))}
              />
              {UNIT[key]}
            </span>
            {key === 'pax' && paxHint === 'guests' ? (
              <span className="text-caption text-muted-foreground">(guests)</span>
            ) : null}
            {key === 'pax' && paxHint === 'edited' ? <Tag tone="warning">edited</Tag> : null}
            {error(errors?.[key]?.message)}
          </td>
        );
      })}
    </>
  );
}

import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { Checkbox } from '@/components/ui/checkbox';
import { FieldError } from '@/components/ui/field';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { NOTE_MAX, type Answers, type ClientFormService } from '../api/client-form.schema';

type ServiceOptionProps = { service: ClientFormService };

/** One tickable service card; ticking reveals its note (spec §7 content rules). */
export function ServiceOption({ service }: ServiceOptionProps) {
  const { control, register, formState } = useFormContext<Answers>();
  const ticked = useWatch({ control, name: `services.${service.id}.ticked` });
  const noteError = formState.errors.services?.[service.id]?.note;
  const checkboxId = `service-${service.id}`;
  const noteId = `note-${service.id}`;
  const noteErrorId = `note-error-${service.id}`;

  return (
    <li
      className={cn(
        'rounded-lg border bg-card transition-colors duration-200',
        ticked ? 'border-gold bg-gold-soft' : 'border-border',
      )}
    >
      <div className="flex items-start gap-3 p-4">
        <Controller
          control={control}
          name={`services.${service.id}.ticked`}
          render={({ field }) => (
            <Checkbox
              id={checkboxId}
              checked={field.value}
              onCheckedChange={(checked) => {
                field.onChange(checked === true);
              }}
              onBlur={field.onBlur}
              ref={field.ref}
              className="mt-0.5 size-6 rounded-sm data-checked:border-gold data-checked:bg-gold [&_svg]:size-4"
            />
          )}
        />
        <Label
          htmlFor={checkboxId}
          className="flex min-h-6 flex-1 cursor-pointer flex-col items-start gap-1"
        >
          <span className="text-body-touch font-semibold">{service.name}</span>
          {service.description ? (
            <span className="text-body font-normal text-muted-foreground">
              {service.description}
            </span>
          ) : null}
        </Label>
      </div>
      {ticked ? (
        <div className="flex flex-col gap-2 px-4 pb-4 pl-13">
          <Label htmlFor={noteId} className="text-label text-muted-foreground">
            Note for your planner (optional)
          </Label>
          <Textarea
            id={noteId}
            maxLength={NOTE_MAX}
            placeholder="For example: mostly vegetarian, one non-veg dinner"
            aria-invalid={noteError ? true : undefined}
            aria-describedby={noteError ? noteErrorId : undefined}
            className="min-h-20 bg-card text-body-touch"
            {...register(`services.${service.id}.note`)}
          />
          {noteError ? <FieldError id={noteErrorId}>{noteError.message}</FieldError> : null}
        </div>
      ) : null}
    </li>
  );
}

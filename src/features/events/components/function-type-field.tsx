import { useQuery } from '@tanstack/react-query';
import { Controller, type Control } from 'react-hook-form';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { functionTypesOptions } from '@/features/catalogue';
import { OTHER_FUNCTION, type EventFunction, type FunctionForm } from '../api/events.schema';

type FunctionTypeFieldProps = {
  control: Control<FunctionForm>;
  /** The function being edited, so a since-archived type stays selectable for it. */
  editing: EventFunction | undefined;
  error: string | undefined;
};

/** Function type from Settings, or Other (spec §10). Archived types can't be newly chosen. */
export function FunctionTypeField({ control, editing, error }: FunctionTypeFieldProps) {
  const types = useQuery(functionTypesOptions());
  const active = (types.data ?? []).filter((type) => !type.archivedAt);
  const keepArchived =
    editing?.functionTypeArchived && editing.functionTypeId
      ? { id: editing.functionTypeId, name: `${editing.name} (archived)` }
      : null;

  return (
    <Field data-invalid={error ? true : undefined}>
      <FieldLabel htmlFor="function-type">Function</FieldLabel>
      <Controller
        control={control}
        name="functionTypeId"
        render={({ field }) => (
          <Select value={field.value} onValueChange={field.onChange} disabled={types.isPending}>
            <SelectTrigger
              id="function-type"
              ref={field.ref}
              onBlur={field.onBlur}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? 'function-type-error' : undefined}
              className="h-10 w-full"
            >
              <SelectValue placeholder={types.isPending ? 'Loading…' : 'Choose a function'} />
            </SelectTrigger>
            <SelectContent position="popper">
              {keepArchived ? (
                <SelectItem value={keepArchived.id}>{keepArchived.name}</SelectItem>
              ) : null}
              {active.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.name}
                </SelectItem>
              ))}
              <SelectSeparator />
              <SelectItem value={OTHER_FUNCTION}>Other…</SelectItem>
            </SelectContent>
          </Select>
        )}
      />
      {types.isError ? (
        <FieldDescription>
          Couldn&apos;t load your function types. You can still choose Other.
        </FieldDescription>
      ) : null}
      {error ? <FieldError id="function-type-error">{error}</FieldError> : null}
    </Field>
  );
}

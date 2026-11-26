import { Check } from 'lucide-react';
import { FieldDescription } from '@/components/ui/field';
import type { EventFunction } from '@/features/events';
import { formatDay } from '@/lib/format';
import { cn } from '@/lib/utils';
import { toggleFunction } from '../lib/task-form';

type FunctionPickerProps = {
  functions: readonly EventFunction[];
  selected: readonly string[];
  /** Add: several (one task each). Edit: at most one. */
  multiple: boolean;
  onChange: (ids: string[]) => void;
};

/** Spec §13: picking a function sets the task's date to that function's date. */
export function FunctionPicker({ functions, selected, multiple, onChange }: FunctionPickerProps) {
  const dates = functions.filter((fn) => selected.includes(fn.id)).map((fn) => formatDay(fn.date));
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-label font-medium">Function (optional)</legend>
      <div className="flex flex-wrap gap-2">
        {functions.map((fn) => {
          const on = selected.includes(fn.id);
          return (
            <button
              key={fn.id}
              type="button"
              aria-pressed={on}
              onClick={() => {
                onChange(toggleFunction(selected, fn.id, multiple));
              }}
              className={cn(
                'inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-label transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                on
                  ? 'border-[1.5px] border-gold bg-gold-soft text-foreground'
                  : 'border-input text-muted-foreground hover:text-foreground',
              )}
            >
              {on ? <Check className="size-4" strokeWidth={1.5} aria-hidden="true" /> : null}
              {fn.name}
              <span className="text-muted-foreground">{formatDay(fn.date)}</span>
            </button>
          );
        })}
      </div>
      {selected.length > 1 ? (
        <FieldDescription>
          One task per function: {selected.length} tasks, each on its function&apos;s date (
          {dates.join(', ')}).
        </FieldDescription>
      ) : selected.length === 1 ? (
        <FieldDescription>Dated on the function: {dates[0]}.</FieldDescription>
      ) : (
        <FieldDescription>Without a function, type the date below.</FieldDescription>
      )}
    </fieldset>
  );
}

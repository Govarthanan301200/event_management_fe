import { Check } from 'lucide-react';
import { FieldError } from '@/components/ui/field';
import { cn } from '@/lib/utils';
import type { FunctionInfo } from '../../lib/line-form';

type FunctionChipsProps = {
  functions: readonly FunctionInfo[];
  selected: readonly string[];
  error: string | undefined;
  onToggle: (functionId: string) => void;
};

const guests = new Intl.NumberFormat('en-IN');

/** S8 step 3 (spec §11): a chip per function on the event; tick one or more. */
export function FunctionChips({ functions, selected, error, onToggle }: FunctionChipsProps) {
  return (
    <fieldset
      className="flex flex-col gap-2"
      aria-describedby={error ? 'line-functions-error' : undefined}
    >
      <legend className="mb-2 text-label font-medium">Functions</legend>
      <div className="flex flex-wrap gap-2">
        {functions.map((fn) => {
          const on = selected.includes(fn.id);
          return (
            <button
              key={fn.id}
              type="button"
              aria-pressed={on}
              onClick={() => {
                onToggle(fn.id);
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
              <span className="text-muted-foreground tabular-nums">
                {guests.format(fn.guestCount)}
              </span>
            </button>
          );
        })}
      </div>
      {error ? <FieldError id="line-functions-error">{error}</FieldError> : null}
    </fieldset>
  );
}

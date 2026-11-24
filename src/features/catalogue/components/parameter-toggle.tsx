import { Check } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { PARAMETER_KEYS, PARAMETER_LABEL, type ParameterKey } from '../api/catalogue.schema';

type ParameterToggleProps = {
  value: ParameterKey[];
  onChange: (value: ParameterKey[]) => void;
  /** Accessible name of the group. */
  label: string;
  /** When false, the last selected chip can't be turned off (a category needs ≥ 1 parameter). */
  allowEmpty?: boolean;
  disabled?: boolean | undefined;
  'aria-describedby'?: string | undefined;
};

/**
 * Spec §4 parameters as chips. Selected = gold border + gold-soft fill + a check, so the state
 * never relies on colour alone.
 */
export function ParameterToggle({
  value,
  onChange,
  label,
  allowEmpty = false,
  disabled,
  'aria-describedby': describedBy,
}: ParameterToggleProps) {
  return (
    <ToggleGroup
      type="multiple"
      value={value}
      disabled={disabled}
      aria-label={label}
      aria-describedby={describedBy}
      className="flex-wrap"
      onValueChange={(next) => {
        const keys = PARAMETER_KEYS.filter((key) => next.includes(key));
        if (keys.length === 0 && !allowEmpty) return;
        onChange(keys);
      }}
    >
      {PARAMETER_KEYS.map((key) => {
        const on = value.includes(key);
        return (
          <ToggleGroupItem
            key={key}
            value={key}
            className="h-8 rounded-full border border-input px-3 text-label text-muted-foreground transition-colors duration-200 data-[state=on]:border-gold data-[state=on]:bg-gold-soft data-[state=on]:text-foreground"
          >
            {on ? <Check className="size-3.5" strokeWidth={1.5} aria-hidden="true" /> : null}
            {PARAMETER_LABEL[key]}
          </ToggleGroupItem>
        );
      })}
    </ToggleGroup>
  );
}

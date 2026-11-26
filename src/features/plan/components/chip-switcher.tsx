import { cn } from '@/lib/utils';

export type ChipOption = { id: string; label: string; detail?: string };

type ChipSwitcherProps = {
  /** Accessible name of the group, e.g. "Functions". */
  label: string;
  options: readonly ChipOption[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
};

/**
 * Function switcher for S9 and the S10 cards (design system chips): outline at rest, gold border
 * and gold-soft fill when chosen. One chip is always chosen; it scrolls sideways on a phone.
 */
export function ChipSwitcher({ label, options, value, onChange, className }: ChipSwitcherProps) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn('flex gap-2 overflow-x-auto whitespace-nowrap', className)}
    >
      {options.map((option) => {
        const on = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={on}
            onClick={() => {
              onChange(option.id);
            }}
            className={cn(
              'inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-3 text-label transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring lg:h-8',
              on
                ? 'border-[1.5px] border-gold bg-gold-soft text-foreground'
                : 'border-input text-muted-foreground hover:text-foreground',
            )}
          >
            {option.label}
            {option.detail ? (
              <span className="text-muted-foreground tabular-nums">{option.detail}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

import { GripVertical } from 'lucide-react';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

type DragHandleProps = ComponentProps<'button'> & { label: string };

/** The ⠿ grip that starts a drag. Keyboard: Space picks up, arrows move, Space drops. */
export function DragHandle({ label, className, ...rest }: DragHandleProps) {
  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        'inline-flex size-6 cursor-grab touch-none items-center justify-center rounded-sm text-subtle-foreground hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:cursor-grabbing',
        className,
      )}
      {...rest}
    >
      <GripVertical className="size-4" strokeWidth={1.5} aria-hidden="true" />
    </button>
  );
}

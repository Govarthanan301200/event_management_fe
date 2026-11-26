import { cva, type VariantProps } from 'class-variance-authority';
import type { ReactNode } from 'react';

const tag = cva(
  'inline-flex items-center rounded-sm px-1.5 text-caption font-medium whitespace-nowrap',
  {
    variants: {
      tone: {
        success: 'bg-success-soft text-success',
        danger: 'bg-danger-soft text-danger',
      },
    },
  },
);

type TaskTagProps = Required<VariantProps<typeof tag>> & { children: ReactNode };

/** Status words on a task (design system: success + check for Done, danger + ⚠ for Issue). */
export function TaskTag({ tone, children }: TaskTagProps) {
  return <span className={tag({ tone })}>{children}</span>;
}

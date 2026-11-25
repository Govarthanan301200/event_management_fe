import { cva, type VariantProps } from 'class-variance-authority';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

const tag = cva(
  'inline-flex items-center rounded-sm px-1.5 text-caption font-medium whitespace-nowrap',
  {
    variants: {
      tone: {
        neutral: 'bg-muted text-muted-foreground',
        warning: 'bg-warning-soft text-warning',
        success: 'bg-success-soft text-success',
        danger: 'bg-danger-soft text-danger',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
);

type TagProps = VariantProps<typeof tag> & { children: ReactNode; className?: string };

/** Status word tags (design system: always a word, never colour alone). */
export function Tag({ tone, children, className }: TagProps) {
  return <span className={cn(tag({ tone }), className)}>{children}</span>;
}

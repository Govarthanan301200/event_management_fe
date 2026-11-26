import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { cn } from '@/lib/utils';

/** "—" for a cell nothing is attributed to; screen readers hear "None". */
export function Dash() {
  return (
    <>
      <span aria-hidden="true" className="text-muted-foreground">
        —
      </span>
      <span className="sr-only">None</span>
    </>
  );
}

type CellLinkProps = {
  to: string;
  /** A fuller accessible name than the figure alone. */
  label?: string | undefined;
  className?: string;
  children: ReactNode;
};

/** A whole-cell link: grid cells, headers and rows open S7 or S9 (spec §12 acceptance). */
export function CellLink({ to, label, className, children }: CellLinkProps) {
  return (
    <Link
      to={to}
      aria-label={label}
      className={cn(
        'block px-3 py-2 hover:underline hover:decoration-gold hover:underline-offset-4 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring',
        className,
      )}
    >
      {children}
    </Link>
  );
}

/** Sticky first column: the raised surface so figures scroll beneath it. */
export const stickyFirst = 'sticky left-0 z-10 border-r border-border text-left';
/** Shared, Total and Envelope columns sit on surface-sunken (design system: Summary). */
export const sunken = 'bg-muted';

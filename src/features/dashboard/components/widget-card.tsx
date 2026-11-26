import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { cn } from '@/lib/utils';

type WidgetCardProps = {
  id: string;
  title: string;
  /** Shown after the title ("Due this week · 9"); left out when undefined. */
  count?: number;
  /** One calm line when there is nothing to show; the card keeps its place (decision 2026-11-26). */
  empty: ReactNode;
  isEmpty: boolean;
  /** "3 more · Upcoming" under the rows. */
  more?: { count: number; to: string; label: string };
  className?: string | undefined;
  children: ReactNode;
};

/** A dashboard widget (S13): raised card, `overline` heading with its count, rows, a "more" link. */
export function WidgetCard({
  id,
  title,
  count,
  empty,
  isEmpty,
  more,
  className,
  children,
}: WidgetCardProps) {
  return (
    <section
      aria-labelledby={id}
      className={cn(
        'flex min-w-0 flex-col overflow-hidden rounded-md border border-border bg-card',
        className,
      )}
    >
      <h2
        id={id}
        // An explicit name: name computation drops the space before the inline count (as S11).
        aria-label={count === undefined ? undefined : `${title} · ${String(count)}`}
        className="border-b border-border px-4 py-3 text-overline"
      >
        {title}
        {count === undefined ? null : <span className="tabular-nums"> · {count}</span>}
      </h2>
      {isEmpty ? <p className="px-4 py-6 text-body text-muted-foreground">{empty}</p> : children}
      {more && more.count > 0 ? (
        <Link
          to={more.to}
          className="border-t border-border px-4 py-3 text-label text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring max-sm:min-h-12"
        >
          <span className="tabular-nums">{more.count}</span> more · {more.label}
        </Link>
      ) : null}
    </section>
  );
}

type RowLinkProps = { to: string; label?: string; children: ReactNode; className?: string };

/** A whole row that opens the screen that resolves it (spec §15 acceptance). 48px on phones. */
export function RowLink({ to, label, children, className }: RowLinkProps) {
  return (
    <li>
      <Link
        to={to}
        aria-label={label}
        className={cn(
          'flex min-h-12 flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 hover:bg-muted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring',
          className,
        )}
      >
        {children}
      </Link>
    </li>
  );
}

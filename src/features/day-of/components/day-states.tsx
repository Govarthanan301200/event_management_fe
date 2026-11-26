import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

/** Skeletons, not spinners (design system). */
export function DaySkeleton({ label }: { label: string }) {
  return (
    <div aria-busy="true" aria-label={label} className="flex flex-col gap-4">
      <Skeleton className="h-9 w-48" />
      <Skeleton className="h-5 w-64" />
      <Skeleton className="h-2 w-full rounded-full" />
      <Skeleton className="h-36 w-full rounded-md" />
      <Skeleton className="h-36 w-full rounded-md" />
    </div>
  );
}

export function DayError({ what, onRetry }: { what: string; onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-start gap-3 py-8">
      <p className="text-body-touch text-danger">
        ⚠ Couldn&apos;t load {what}. Check your connection.
      </p>
      <Button variant="outline" className="h-12 px-4" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}

/** Empty states invite (design system): a `title-serif` line, one sentence, one action. */
export function DayEmpty({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-start gap-2 py-10">
      <h2 className="text-title-serif">{title}</h2>
      <p className="text-body-touch text-muted-foreground">{children}</p>
      {action}
    </div>
  );
}

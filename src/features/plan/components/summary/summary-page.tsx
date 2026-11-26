import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useWorkspaceEvent } from '@/features/events';
import { summaryOptions } from '@/features/summary';
import { useMediaQuery } from '@/hooks/use-media-query';
import { NoFunctions } from '../no-functions';
import { CategoryCards } from './category-cards';
import { HeadlineCards } from './headline-cards';
import { SummaryGrid } from './summary-grid';

/**
 * S10 Summary (spec §12): headline cards, then the category × function grid with Shared, Total
 * and Envelope, or category cards with a function switcher below 1024px. Every figure is the
 * server's roll-up.
 */
export function SummaryPage() {
  const { event } = useWorkspaceEvent();
  const summary = useQuery(summaryOptions(event.id));
  const wide = useMediaQuery('(min-width: 1024px)');

  if (summary.isPending) {
    return (
      <div aria-busy="true" aria-label="Loading the summary" className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {['budget', 'planned', 'left', 'over'].map((card) => (
            <Skeleton key={card} className="h-24 rounded-md" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-md" />
      </div>
    );
  }
  if (summary.isError) {
    return (
      <div role="alert" className="flex flex-col items-start gap-3">
        <p className="text-body text-danger">⚠ Couldn&apos;t load the summary.</p>
        <Button variant="outline" onClick={() => void summary.refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  const data = summary.data;
  if (data.categories.length === 0 && event.functions.length === 0) {
    return <NoFunctions eventId={event.id} />;
  }
  return (
    <div className="flex flex-col gap-6">
      <HeadlineCards summary={data} />
      {data.categories.length === 0 ? (
        <div className="flex flex-col items-start gap-2 py-6">
          <h2 className="text-title-serif">Nothing planned yet</h2>
          <p className="text-body text-muted-foreground">
            Add services on the plan and the money shows up here, by category and function.
          </p>
          <Button asChild variant="outline">
            <Link to={`/events/${event.id}/plan`}>Open plan</Link>
          </Button>
        </div>
      ) : (
        <section aria-label="By category" className="flex flex-col gap-2">
          <p className="text-caption text-muted-foreground">
            {wide ? 'Amounts in ₹. ' : ''}Shared amounts cover several functions and are never split
            between them.
          </p>
          {wide ? (
            <SummaryGrid eventId={event.id} summary={data} />
          ) : (
            <CategoryCards eventId={event.id} summary={data} />
          )}
        </section>
      )}
    </div>
  );
}

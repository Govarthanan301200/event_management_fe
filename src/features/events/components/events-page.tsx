import { Link, useSearchParams } from 'react-router';
import { cn } from '@/lib/utils';
import type { EventView } from '../api/events.schema';
import { CreateEventDialog } from './create-event-dialog';
import { EventList } from './event-list';

const views: { view: EventView; label: string }[] = [
  { view: 'upcoming', label: 'Upcoming' },
  { view: 'past', label: 'Past' },
];

/** S5 event list, split into Upcoming and Past by the last function's date (decision 2026-11-25). */
export function EventsPage() {
  const [params] = useSearchParams();
  const view: EventView = params.get('view') === 'past' ? 'past' : 'upcoming';

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-headline">Events</h1>
        <CreateEventDialog />
      </div>
      <nav aria-label="Event lists" className="flex gap-6 border-b border-border">
        {views.map((item) => (
          <Link
            key={item.view}
            to={item.view === 'upcoming' ? '/events' : '/events?view=past'}
            aria-current={item.view === view ? 'page' : undefined}
            className={cn(
              '-mb-px border-b-2 pb-2 text-label transition-colors duration-200',
              item.view === view
                ? 'border-gold text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <EventList key={view} view={view} />
    </div>
  );
}

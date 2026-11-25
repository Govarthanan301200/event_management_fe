import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, NavLink, Outlet, useParams } from 'react-router';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiError } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { eventDetailOptions } from '../api/events.api';
import type { WorkspaceContext } from '../hooks/use-workspace-event';
import { EditEventDialog } from './edit-event-dialog';
import { EventHeader } from './event-header';

// Spec §3 event tabs. By function, Summary and Tasks are added with Modules 6 and 7.
const tabs = [
  { to: '', label: 'Overview', end: true },
  { to: 'plan', label: 'Plan by category', end: false },
];

/** The event workspace (design system: header, tabs, then the one gold hairline). */
export function EventWorkspace() {
  const { eventId = '' } = useParams();
  const query = useQuery(eventDetailOptions(eventId));
  const [editing, setEditing] = useState(false);

  if (query.isPending) {
    return (
      <div aria-busy="true" aria-label="Loading event" className="flex flex-col gap-4">
        <Skeleton className="h-9 w-1/2" />
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-40 w-full rounded-md" />
      </div>
    );
  }
  if (query.isError) {
    const missing = query.error instanceof ApiError && query.error.status === 404;
    return (
      <div role="alert" className="flex flex-col items-start gap-3 py-16">
        <h1 className="text-title-serif">
          {missing ? "This event doesn't exist" : "Couldn't load this event"}
        </h1>
        {missing ? (
          <Button asChild variant="outline">
            <Link to="/events">Back to events</Link>
          </Button>
        ) : (
          <Button variant="outline" onClick={() => void query.refetch()}>
            Try again
          </Button>
        )}
      </div>
    );
  }

  const event = query.data;
  const context: WorkspaceContext = {
    event,
    editDetails: () => {
      setEditing(true);
    },
  };
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <EventHeader event={event} onEditDetails={context.editDetails} />
        <nav aria-label="Event sections" className="flex gap-6 border-b border-gold">
          {tabs.map((tab) => (
            <NavLink
              key={tab.label}
              to={tab.to === '' ? `/events/${event.id}` : `/events/${event.id}/${tab.to}`}
              end={tab.end}
              className={({ isActive }) =>
                cn(
                  '-mb-px border-b-2 pb-2 text-label transition-colors duration-200',
                  isActive
                    ? 'border-gold text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground',
                )
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </div>
      <Outlet context={context} />
      {editing ? <EditEventDialog event={event} open onOpenChange={setEditing} /> : null}
    </div>
  );
}

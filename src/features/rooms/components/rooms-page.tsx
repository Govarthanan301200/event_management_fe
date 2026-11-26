import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useWorkspaceEvent } from '@/features/events';
import { useRooms } from '../hooks/use-rooms';
import { RoomsSheet } from './rooms-sheet';

/**
 * S14 Rooms and guests (spec §10): the event's rooming sheet, opened from the line of a service
 * with rooms on S7 (decision 2026-11-27). Saves automatically; no formulas or checks.
 */
export function RoomsPage() {
  const { event } = useWorkspaceEvent();
  const rooms = useRooms(event.id);
  return (
    <div className="flex flex-col gap-4">
      <nav aria-label="Breadcrumb" className="text-label text-muted-foreground">
        <Link
          to={`/events/${event.id}/plan`}
          className="underline decoration-gold underline-offset-4 hover:text-foreground"
        >
          Plan
        </Link>{' '}
        / <span aria-current="page">Rooms and guests</span>
      </nav>
      {rooms.isPending ? <RoomsSkeleton /> : null}
      {rooms.isError ? (
        <div role="alert" className="flex flex-col items-start gap-3">
          <p className="text-body text-danger">⚠ Couldn&apos;t load the rooms and guests.</p>
          <Button variant="outline" onClick={() => void rooms.refetch()}>
            Try again
          </Button>
        </div>
      ) : null}
      {rooms.data ? (
        <RoomsSheet eventId={event.id} eventName={event.name} rooms={rooms.data} />
      ) : null}
    </div>
  );
}

function RoomsSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading rooms and guests" className="flex flex-col gap-3">
      <Skeleton className="h-9 w-64" />
      <Skeleton className="h-8 w-96 max-w-full" />
      {['a', 'b', 'c', 'd'].map((key) => (
        <Skeleton key={key} className="h-10 w-full" />
      ))}
    </div>
  );
}

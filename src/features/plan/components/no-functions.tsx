import { Link } from 'react-router';
import { Button } from '@/components/ui/button';

type NoFunctionsProps = { eventId: string };

/** S7, S9 and S10 before the event has functions: everything is planned per function. */
export function NoFunctions({ eventId }: NoFunctionsProps) {
  return (
    <div className="flex flex-col items-start gap-2 py-12">
      <h2 className="text-title-serif">Add functions first</h2>
      <p className="text-body text-muted-foreground">
        Each service covers one or more functions. Add Mehendi, Sangeet and the rest on the
        overview.
      </p>
      <Button asChild variant="outline">
        <Link to={`/events/${eventId}`}>Go to overview</Link>
      </Button>
    </div>
  );
}

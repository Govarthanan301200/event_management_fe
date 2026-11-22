import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { STATUS_LABEL, type EventStatus } from '../api/events.schema';

type EventStatusBadgeProps = { status: EventStatus };

/** Event status badges are neutral, except Cancelled (design system: Badges). */
export function EventStatusBadge({ status }: EventStatusBadgeProps) {
  return (
    <Badge
      className={cn(
        'rounded-sm text-caption font-medium',
        status === 'cancelled' ? 'bg-danger-soft text-danger' : 'bg-muted text-muted-foreground',
      )}
    >
      {STATUS_LABEL[status]}
    </Badge>
  );
}

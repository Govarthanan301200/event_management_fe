import type { Dashboard } from '../api/dashboard.schema';
import { links, moreCount, sentLabel } from '../lib/dashboard';
import { RowLink, WidgetCard } from './widget-card';

type SubmissionsWidgetProps = {
  submissions: Dashboard['submissions'];
  today: string;
  timeZone: string;
  className?: string;
};

/** Spec §15 widget 3: Requested events, newest first, with their Not planned count; opens S6. */
export function SubmissionsWidget({
  submissions,
  today,
  timeZone,
  className,
}: SubmissionsWidgetProps) {
  return (
    <WidgetCard
      id="dashboard-submissions"
      title="New client submissions"
      className={className}
      count={submissions.total}
      isEmpty={submissions.total === 0}
      empty="No new submissions. Client forms you send appear here once they're filled in."
      more={{ count: moreCount(submissions), to: '/events', label: 'Events' }}
    >
      <ul className="divide-y divide-border">
        {submissions.items.map((submission) => (
          <RowLink key={submission.eventId} to={links.event(submission.eventId)}>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="truncate text-body font-semibold">{submission.name}</span>
              <span className="text-caption text-muted-foreground">
                {sentLabel(submission.formSubmittedAt, today, timeZone) ?? submission.clientName}
              </span>
            </span>
            <span className="shrink-0 text-right text-figure text-muted-foreground">
              <span className="text-foreground">{submission.notPlanned}</span> not planned
            </span>
          </RowLink>
        ))}
      </ul>
    </WidgetCard>
  );
}

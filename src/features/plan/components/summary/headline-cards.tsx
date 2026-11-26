import type { ReactNode } from 'react';
import type { EventMoneySummary } from '@/features/summary';
import { formatINR } from '@/lib/format';

type HeadlineCardsProps = { summary: EventMoneySummary };

/** S10 headline cards (spec §12): event budget, planned, left, and categories over envelope. */
export function HeadlineCards({ summary }: HeadlineCardsProps) {
  const { overallBudget, planned, left, services, categoriesOver, categoriesWithEnvelope } =
    summary;
  return (
    <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
      <Card label="Budget" note={overallBudget === null ? 'Set it in Edit details' : null}>
        {overallBudget === null ? (
          <span className="text-muted-foreground">Not set</span>
        ) : (
          formatINR(overallBudget)
        )}
      </Card>
      <Card label="Planned" note={services === 1 ? '1 service' : `${services} services`}>
        {formatINR(planned)}
      </Card>
      <Card label="Left" note={left !== null && left < 0 ? 'over the budget' : null}>
        <LeftFigure left={left} />
      </Card>
      <Card
        label="Over envelope"
        note={
          categoriesWithEnvelope === 0
            ? 'No envelopes set'
            : `of ${categoriesWithEnvelope} with an envelope`
        }
      >
        <OverFigure over={categoriesOver} />
      </Card>
    </dl>
  );
}

type CardProps = { label: string; note: string | null; children: ReactNode };

function Card({ label, note, children }: CardProps) {
  return (
    <div className="flex flex-col gap-1 rounded-md border border-border bg-card p-4">
      <dt className="text-label text-muted-foreground">{label}</dt>
      <dd className="flex flex-col gap-0.5">
        <span className="text-figure-lg">{children}</span>
        {note ? <span className="text-caption text-muted-foreground">{note}</span> : null}
      </dd>
    </div>
  );
}

type LeftFigureProps = { left: number | null };

function LeftFigure({ left }: LeftFigureProps) {
  if (left === null) {
    return (
      <>
        <span aria-hidden="true" className="text-muted-foreground">
          —
        </span>
        <span className="sr-only">No overall budget</span>
      </>
    );
  }
  if (left < 0) return <span className="text-danger">⚠ {formatINR(-left)}</span>;
  return formatINR(left);
}

type OverFigureProps = { over: number };

function OverFigure({ over }: OverFigureProps) {
  if (over === 0) return 'None';
  return <span className="text-danger">⚠ {over}</span>;
}

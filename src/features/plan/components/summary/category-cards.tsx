import { useState } from 'react';
import { Link } from 'react-router';
import { Meter } from '@/components/shared/meter';
import type { EventMoneySummary } from '@/features/summary';
import { formatINR } from '@/lib/format';
import { cn } from '@/lib/utils';
import {
  categoryCards,
  selectionFrom,
  type CategoryCardView,
  type SummarySelection,
} from '../../lib/summary-view';
import { ChipSwitcher } from '../chip-switcher';

type CategoryCardsProps = { eventId: string; summary: EventMoneySummary };

/**
 * S10 below 1024px (decision 2026-11-26): a switcher (All, each function, Shared) over category
 * cards. "All" measures each category against its envelope with a meter; a card opens S7 at its
 * band, or S9 at the category when a function is chosen.
 */
export function CategoryCards({ eventId, summary }: CategoryCardsProps) {
  const [chosen, setChosen] = useState('all');
  const selection = selectionFrom(chosen);
  const { cards, total } = categoryCards(summary, selection);
  const options = [
    { id: 'all', label: 'All' },
    ...summary.functions.map((fn) => ({ id: fn.id, label: fn.name })),
    ...(summary.shared > 0 ? [{ id: 'shared', label: 'Shared' }] : []),
  ];
  const fnName = summary.functions.find((fn) => fn.id === chosen)?.name;
  const hrefFor = (card: CategoryCardView) =>
    selection.kind === 'function'
      ? `/events/${eventId}/by-function?fn=${selection.id}#fn-cat-${card.id}`
      : `/events/${eventId}/plan#band-${card.id}`;

  return (
    <div className="flex flex-col gap-3">
      <ChipSwitcher
        label="Show amounts for"
        options={options}
        value={chosen}
        onChange={setChosen}
      />
      {cards.length === 0 ? (
        <p className="py-4 text-body text-muted-foreground">
          Nothing planned for {fnName ?? 'this function'} yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {cards.map((card) => (
            <li key={card.id}>
              <Link
                to={hrefFor(card)}
                className="flex flex-col gap-2 rounded-md border border-border bg-card p-4 hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <span className="flex items-baseline justify-between gap-3">
                  <span className="text-overline">{card.name}</span>
                  <span className="text-figure">{formatINR(card.amount)}</span>
                </span>
                <EnvelopeLine card={card} selection={selection} />
              </Link>
            </li>
          ))}
        </ul>
      )}
      <p className="flex items-baseline justify-between gap-3 rounded-md border border-border bg-muted p-4 text-body font-semibold">
        {selectionTotalLabel(selection, fnName)}
        <span className="tabular-nums">{formatINR(total)}</span>
      </p>
    </div>
  );
}

function selectionTotalLabel(selection: SummarySelection, fnName: string | undefined): string {
  if (selection.kind === 'shared') return 'Shared total';
  if (selection.kind === 'function') return `${fnName ?? 'Function'} total`;
  return 'Total planned';
}

type EnvelopeLineProps = { card: CategoryCardView; selection: SummarySelection };

function EnvelopeLine({ card, selection }: EnvelopeLineProps) {
  if (selection.kind !== 'all') return null;
  if (card.envelope === null || card.left === null) {
    return <span className="text-caption text-muted-foreground">No envelope</span>;
  }
  const over = card.left < 0;
  return (
    <>
      <Meter value={card.amount} max={card.envelope} />
      <span
        className={cn(
          'text-caption tabular-nums',
          over ? 'font-medium text-danger' : 'text-muted-foreground',
        )}
      >
        {over
          ? `⚠ ${formatINR(-card.left)} over ${formatINR(card.envelope)}`
          : `${formatINR(card.left)} left of ${formatINR(card.envelope)}`}
      </span>
    </>
  );
}

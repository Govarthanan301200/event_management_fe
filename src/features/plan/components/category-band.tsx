import { RowMenu } from '@/components/shared/row-menu';
import type { EventFunction } from '@/features/events';
import type { LineRollup } from '@/features/summary';
import type { ServiceLine } from '../api/plan.schema';
import type { BandView } from '../lib/plan-view';
import { EnvelopeSummary } from './envelope-summary';
import { LineRow } from './line-row';

type CategoryBandProps = {
  band: BandView;
  functions: readonly EventFunction[];
  /** Server attribution per line id (spec §12). */
  rollups: ReadonlyMap<string, LineRollup>;
  onAdd: () => void;
  onEditEnvelope: () => void;
  onEditLine: (line: ServiceLine) => void;
  onRemoveLine: (line: ServiceLine) => void;
};

/** S7 category band: overline name, envelope meter and ⋯, then its service lines. */
export function CategoryBand({
  band,
  functions,
  rollups,
  onAdd,
  onEditEnvelope,
  onEditLine,
  onRemoveLine,
}: CategoryBandProps) {
  const { category, lines } = band;
  const headingId = `band-${category.id}`;
  const serviceOf = (serviceId: string) =>
    category.services.find((service) => service.id === serviceId);

  return (
    <section
      aria-labelledby={headingId}
      className="overflow-hidden rounded-md border border-border"
    >
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 bg-muted px-4 py-2">
        <h2 id={headingId} className="scroll-mt-14 text-overline">
          {category.name}
          {category.archivedAt ? (
            <span className="ml-2 text-muted-foreground normal-case">(archived)</span>
          ) : null}
        </h2>
        <div className="flex items-center gap-2">
          {lines.length > 0 || band.envelope !== null ? (
            <EnvelopeSummary envelope={band.envelope} planned={band.planned} left={band.left} />
          ) : null}
          <RowMenu
            label={`Actions for ${category.name}`}
            items={[
              {
                label: band.envelope === null ? 'Set envelope' : 'Change envelope',
                onSelect: onEditEnvelope,
              },
              {
                label: `Add service to ${category.name}`,
                disabled: category.archivedAt !== null,
                onSelect: onAdd,
              },
            ]}
          />
        </div>
      </div>
      {lines.length === 0 ? (
        <p className="flex flex-wrap items-center justify-between gap-2 bg-card px-4 py-3 text-label text-muted-foreground">
          No services yet
          <button
            type="button"
            onClick={onAdd}
            className="text-foreground underline decoration-gold underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Add service to {category.name}
          </button>
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {lines.map((line) => {
            const service = serviceOf(line.serviceId);
            return (
              <LineRow
                key={line.id}
                line={line}
                rollup={rollups.get(line.id)}
                parameters={service?.effectiveParameters ?? category.parameters}
                paxPrefill={
                  category.paxPrefill && (service?.effectiveParameters ?? []).includes('pax')
                }
                functions={functions}
                onEdit={() => {
                  onEditLine(line);
                }}
                onRemove={() => {
                  onRemoveLine(line);
                }}
              />
            );
          })}
        </ul>
      )}
    </section>
  );
}

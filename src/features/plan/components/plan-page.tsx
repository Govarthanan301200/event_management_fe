import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { catalogueOptions } from '@/features/catalogue';
import { useWorkspaceEvent } from '@/features/events';
import type { ServiceLine } from '../api/plan.schema';
import { usePlan } from '../hooks/use-plan';
import { groupByCategory, type BandView } from '../lib/plan-view';
import { sumOfLines } from '../lib/rollup';
import { CategoryBand } from './category-band';
import { ServiceDrawer, type DrawerState } from './drawer/service-drawer';
import { EnvelopeDialog } from './envelope-dialog';
import { PlanSummary } from './plan-summary';
import { RemoveLineDialog } from './remove-line-dialog';

/**
 * S7 Plan by category (spec §11): category bands with envelopes, service lines that expand to
 * their function rows, and the S8 drawer. `?add=<serviceId>` (from S6) opens the drawer.
 */
export function PlanPage() {
  const { event } = useWorkspaceEvent();
  const plan = usePlan(event.id);
  const catalogue = useQuery(catalogueOptions());
  const [params, setParams] = useSearchParams();
  const [drawer, setDrawer] = useState<DrawerState | null>(null);
  const [envelopeFor, setEnvelopeFor] = useState<BandView | null>(null);
  const [removing, setRemoving] = useState<ServiceLine | null>(null);

  const addParam = params.get('add');
  const active: DrawerState | null =
    drawer ?? (addParam ? { kind: 'add', serviceId: addParam } : null);
  const closeDrawer = () => {
    setDrawer(null);
    if (addParam) setParams({}, { replace: true });
  };

  if (event.functions.length === 0) {
    return (
      <div className="flex flex-col items-start gap-2 py-12">
        <h2 className="text-title-serif">Add functions first</h2>
        <p className="text-body text-muted-foreground">
          Each service covers one or more functions. Add Mehendi, Sangeet and the rest on the
          overview.
        </p>
        <Button asChild variant="outline">
          <Link to={`/events/${event.id}`}>Go to overview</Link>
        </Button>
      </div>
    );
  }
  if (plan.isPending || catalogue.isPending) {
    return (
      <div aria-busy="true" aria-label="Loading the plan" className="flex flex-col gap-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full rounded-md" />
        <Skeleton className="h-24 w-full rounded-md" />
      </div>
    );
  }
  if (plan.isError || catalogue.isError) {
    return (
      <div role="alert" className="flex flex-col items-start gap-3">
        <p className="text-body text-danger">⚠ Couldn&apos;t load the plan.</p>
        <Button
          variant="outline"
          onClick={() => void Promise.all([plan.refetch(), catalogue.refetch()])}
        >
          Try again
        </Button>
      </div>
    );
  }

  const bands = groupByCategory(catalogue.data, plan.data);
  return (
    <div className="flex flex-col gap-4">
      <PlanSummary
        event={event}
        planned={sumOfLines(plan.data.lines)}
        onAdd={() => {
          setDrawer({ kind: 'add' });
        }}
      />
      <div className="flex flex-col gap-4">
        {bands.map((band) => (
          <CategoryBand
            key={band.category.id}
            band={band}
            functions={event.functions}
            onAdd={() => {
              setDrawer({ kind: 'add', categoryId: band.category.id });
            }}
            onEditEnvelope={() => {
              setEnvelopeFor(band);
            }}
            onEditLine={(line) => {
              setDrawer({ kind: 'edit', lineId: line.id });
            }}
            onRemoveLine={setRemoving}
          />
        ))}
      </div>
      {active ? (
        <ServiceDrawer
          key={
            active.kind === 'edit'
              ? active.lineId
              : `add-${active.serviceId ?? active.categoryId ?? ''}`
          }
          eventId={event.id}
          functions={event.functions}
          catalogue={catalogue.data}
          plan={plan.data}
          state={active}
          onOpenLine={(lineId) => {
            setDrawer({ kind: 'edit', lineId });
          }}
          onClose={closeDrawer}
        />
      ) : null}
      {envelopeFor ? (
        <EnvelopeDialog
          eventId={event.id}
          categoryId={envelopeFor.category.id}
          categoryName={envelopeFor.category.name}
          envelope={envelopeFor.envelope}
          onClose={() => {
            setEnvelopeFor(null);
          }}
        />
      ) : null}
      <RemoveLineDialog
        eventId={event.id}
        line={removing}
        onClose={() => {
          setRemoving(null);
        }}
      />
    </div>
  );
}

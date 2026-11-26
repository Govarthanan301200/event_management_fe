import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { catalogueOptions } from '@/features/catalogue';
import { useWorkspaceEvent } from '@/features/events';
import { summaryOptions } from '@/features/summary';
import { FunctionTasksPanel } from '@/features/tasks';
import { usePlan } from '../../hooks/use-plan';
import { useScrollToHash } from '../../hooks/use-scroll-to-hash';
import { functionPlanView, pickFunction, todayIn } from '../../lib/by-function-view';
import { ChipSwitcher } from '../chip-switcher';
import { ServiceDrawer } from '../drawer/service-drawer';
import { NoFunctions } from '../no-functions';
import { FunctionHeader } from './function-header';
import { FunctionPlanList } from './function-plan-list';

const guests = new Intl.NumberFormat('en-IN');

/**
 * S9 Plan by function (spec §12): pick a function, see each category's services with their
 * effective vendor, quantities and budget, and the Shared lines apart. `?fn=<id>` picks the
 * function (S10 links here). The Tasks panel lists the function's tasks (spec §12, §13).
 */
export function ByFunctionPage() {
  const { event } = useWorkspaceEvent();
  const plan = usePlan(event.id);
  const catalogue = useQuery(catalogueOptions());
  const summary = useQuery(summaryOptions(event.id));
  const [params, setParams] = useSearchParams();
  const [editing, setEditing] = useState<string | null>(null);
  useScrollToHash(plan.isSuccess && catalogue.isSuccess && summary.isSuccess);

  const selected = pickFunction(event.functions, params.get('fn'), todayIn());
  if (!selected) return <NoFunctions eventId={event.id} />;
  if (plan.isPending || catalogue.isPending || summary.isPending) {
    return (
      <div aria-busy="true" aria-label="Loading the function plan" className="flex flex-col gap-3">
        <Skeleton className="h-10 w-2/3 rounded-full" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-24 w-full rounded-md" />
      </div>
    );
  }
  if (plan.isError || catalogue.isError || summary.isError) {
    return (
      <div role="alert" className="flex flex-col items-start gap-3">
        <p className="text-body text-danger">⚠ Couldn&apos;t load the plan.</p>
        <Button
          variant="outline"
          onClick={() => void Promise.all([plan.refetch(), catalogue.refetch(), summary.refetch()])}
        >
          Try again
        </Button>
      </div>
    );
  }

  const view = functionPlanView(selected.id, plan.data, summary.data, catalogue.data);
  const total = summary.data.functions.find((fn) => fn.id === selected.id)?.total ?? 0;
  const empty = view.categories.length === 0 && view.shared.length === 0;
  return (
    <div className="flex flex-col gap-6">
      <div className="sticky top-0 z-10 -mx-1 bg-background px-1 py-2 shadow-sticky">
        <ChipSwitcher
          label="Functions"
          value={selected.id}
          options={event.functions.map((fn) => ({
            id: fn.id,
            label: fn.name,
            detail: guests.format(fn.guestCount),
          }))}
          onChange={(fn) => {
            setParams({ fn });
          }}
        />
      </div>
      <FunctionHeader fn={selected} total={total} />
      {empty ? (
        <div className="flex flex-col items-start gap-2 py-6">
          <h3 className="text-title-serif">Nothing planned for {selected.name} yet</h3>
          <p className="text-body text-muted-foreground">
            Services you tick {selected.name} for on the plan show up here.
          </p>
          <Button asChild variant="outline">
            <Link to={`/events/${event.id}/plan`}>Open plan</Link>
          </Button>
        </div>
      ) : (
        <FunctionPlanList view={view} onEdit={setEditing} />
      )}
      <FunctionTasksPanel key={selected.id} eventId={event.id} fn={selected} />
      {editing ? (
        <ServiceDrawer
          key={editing}
          eventId={event.id}
          functions={event.functions}
          catalogue={catalogue.data}
          plan={plan.data}
          state={{ kind: 'edit', lineId: editing }}
          onOpenLine={setEditing}
          onClose={() => {
            setEditing(null);
          }}
        />
      ) : null}
    </div>
  );
}

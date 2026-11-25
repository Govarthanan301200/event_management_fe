import { ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { RowMenu } from '@/components/shared/row-menu';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { EventFunction } from '@/features/events';
import { formatINR } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { ServiceLine } from '../api/plan.schema';
import { summariseQuantities, type ParameterKey } from '../lib/quantities';
import { isShared, lineTotal } from '../lib/rollup';
import { LineRowsTable } from './line-rows-table';
import { Tag } from './tag';

type LineRowProps = {
  line: ServiceLine;
  parameters: readonly ParameterKey[];
  paxPrefill: boolean;
  functions: readonly EventFunction[];
  onEdit: () => void;
  onRemove: () => void;
};

/** One S7 service line: a one-line summary that expands to its function rows. */
export function LineRow({
  line,
  parameters,
  paxPrefill,
  functions,
  onEdit,
  onRemove,
}: LineRowProps) {
  const [open, setOpen] = useState(false);
  const total = lineTotal(line);
  const hasBudget = line.lineBudget !== null || line.rows.some((row) => row.budget !== null);
  const covered = functions.filter((fn) => line.rows.some((row) => row.eventFunctionId === fn.id));
  const coverage =
    covered.length === 0
      ? null
      : covered.length <= 3
        ? covered.map((fn) => fn.name).join(', ')
        : `${covered.length} functions`;
  const onlyRow = line.rows.length === 1 ? line.rows[0] : undefined;
  const quantities = onlyRow ? summariseQuantities(parameters, onlyRow.quantities) : '';
  const meta = [line.defaultVendor?.name ?? 'No vendor yet', coverage, quantities]
    .filter(Boolean)
    .join(' · ');

  return (
    <Collapsible open={open} onOpenChange={setOpen} asChild>
      <li className="bg-card">
        <div className="flex min-h-11 items-center gap-2 px-2 py-2">
          <CollapsibleTrigger
            aria-label={`${open ? 'Hide' : 'Show'} functions for ${line.serviceName}`}
            className="inline-flex size-6 shrink-0 items-center justify-center rounded-sm text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            disabled={line.rows.length === 0}
          >
            <ChevronRight
              className={cn('size-4 transition-transform duration-200', open && 'rotate-90')}
              strokeWidth={1.5}
              aria-hidden="true"
            />
          </CollapsibleTrigger>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={onEdit}
                className="text-left text-body font-semibold hover:underline hover:decoration-gold hover:underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                {line.serviceName}
              </button>
              {isShared(line) ? <Tag>Shared</Tag> : null}
              {line.rows.length === 0 ? <Tag tone="warning">No functions</Tag> : null}
              {line.serviceArchived ? <Tag tone="warning">archived service</Tag> : null}
              {line.defaultVendor && !line.defaultVendor.offersService ? (
                <Tag tone="warning">vendor no longer offers this service</Tag>
              ) : null}
              {line.defaultVendor?.archived ? <Tag tone="warning">archived vendor</Tag> : null}
            </span>
            <span className="truncate text-caption text-muted-foreground" title={meta}>
              {meta}
            </span>
          </div>
          <span className="shrink-0 text-right text-body tabular-nums">
            {hasBudget ? (
              formatINR(total)
            ) : (
              <span className="text-label text-muted-foreground">No budget</span>
            )}
          </span>
          <RowMenu
            label={`Actions for ${line.serviceName}`}
            items={[
              { label: 'Edit', onSelect: onEdit },
              { label: 'Remove from plan', tone: 'danger', onSelect: onRemove },
            ]}
          />
        </div>
        <CollapsibleContent className="border-t border-border pb-2 pl-10">
          <LineRowsTable
            line={line}
            parameters={parameters}
            paxPrefill={paxPrefill}
            functions={functions}
          />
        </CollapsibleContent>
      </li>
    </Collapsible>
  );
}

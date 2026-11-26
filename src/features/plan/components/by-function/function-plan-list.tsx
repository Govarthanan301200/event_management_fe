import { formatINR } from '@/lib/format';
import type { FunctionPlanView } from '../../lib/by-function-view';
import { Tag } from '../tag';
import { FunctionLineItem } from './function-line-item';

type FunctionPlanListProps = { view: FunctionPlanView; onEdit: (lineId: string) => void };

/**
 * S9 body (spec §12): a band per category with this function's amount, then "Shared across event"
 * for line budgets that cover several functions. Those are never split, so they carry no amount
 * for this function, only the whole line's figure as context.
 */
export function FunctionPlanList({ view, onEdit }: FunctionPlanListProps) {
  return (
    <div className="flex flex-col gap-4">
      {view.categories.map((category) => (
        <section
          key={category.id}
          aria-labelledby={`fn-cat-${category.id}`}
          className="overflow-hidden rounded-md border border-border"
        >
          <div className="flex items-center justify-between gap-3 bg-muted px-4 py-2">
            <h3 id={`fn-cat-${category.id}`} className="scroll-mt-16 text-overline">
              {category.name}
            </h3>
            <span className="text-label tabular-nums">{formatINR(category.amount)}</span>
          </div>
          <ul className="divide-y divide-border">
            {category.lines.map((line) => (
              <FunctionLineItem
                key={line.lineId}
                line={line}
                onEdit={() => {
                  onEdit(line.lineId);
                }}
                trailing={
                  line.amount === null ? (
                    <span className="text-label text-muted-foreground">No budget</span>
                  ) : (
                    <span className="text-figure">{formatINR(line.amount)}</span>
                  )
                }
              />
            ))}
          </ul>
        </section>
      ))}
      {view.shared.length > 0 ? (
        <section
          aria-labelledby="fn-shared"
          className="overflow-hidden rounded-md border border-border"
        >
          <div className="flex flex-wrap items-center justify-between gap-x-3 bg-muted px-4 py-2">
            <h3 id="fn-shared" className="text-overline">
              Shared across event
            </h3>
            <span className="text-caption text-muted-foreground">Not split between functions</span>
          </div>
          <ul className="divide-y divide-border">
            {view.shared.map((line) => (
              <FunctionLineItem
                key={line.lineId}
                line={line}
                tag={<Tag>Shared</Tag>}
                onEdit={() => {
                  onEdit(line.lineId);
                }}
                trailing={
                  <span className="text-label text-muted-foreground tabular-nums">
                    {formatINR(line.total)} across{' '}
                    {line.functionCount === 1 ? '1 function' : `${line.functionCount} functions`}
                  </span>
                }
              />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

import type { ReactNode } from 'react';
import type { FunctionLineView } from '../../lib/by-function-view';
import { Tag } from '../tag';

type FunctionLineItemProps = {
  line: FunctionLineView;
  /** The right-hand figure or note. */
  trailing: ReactNode;
  tag?: ReactNode;
  onEdit: () => void;
};

/** One S9 service: name (opens S8), effective vendor, this function's quantities, then money. */
export function FunctionLineItem({ line, trailing, tag, onEdit }: FunctionLineItemProps) {
  const meta = [line.vendor ?? 'No vendor yet', line.quantities].filter(Boolean).join(' · ');
  return (
    <li className="flex min-h-11 items-center gap-3 bg-card px-4 py-2">
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={onEdit}
            className="text-left text-body font-semibold hover:underline hover:decoration-gold hover:underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {line.serviceName}
          </button>
          {tag}
          {line.vendorChanged ? <Tag tone="warning">changed</Tag> : null}
        </span>
        <span className="truncate text-caption text-muted-foreground" title={meta}>
          {meta}
        </span>
      </div>
      <div className="shrink-0 text-right">{trailing}</div>
    </li>
  );
}

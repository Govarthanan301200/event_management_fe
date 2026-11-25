import { cn } from '@/lib/utils';
import type { FunctionType } from '../api/catalogue.schema';
import { useSortableRow } from '@/hooks/use-sortable-row';
import { DragHandle } from '@/components/shared/drag-handle';
import { RowMenu, type RowMenuItem } from '@/components/shared/row-menu';

type FunctionTypeRowProps = { functionType: FunctionType; actions: RowMenuItem[] };

export function FunctionTypeRow({ functionType, actions }: FunctionTypeRowProps) {
  const { attachRow, attachHandle, handleProps, style, className, isDragging } = useSortableRow(
    functionType.id,
  );
  return (
    <li
      ref={attachRow}
      style={style}
      data-dragging={isDragging}
      className={cn('flex min-h-11 items-center gap-2 bg-card px-2', className)}
    >
      <DragHandle label={`Reorder ${functionType.name}`} ref={attachHandle} {...handleProps} />
      <span className="min-w-0 flex-1 truncate text-body">{functionType.name}</span>
      <RowMenu label={`Actions for ${functionType.name}`} items={actions} />
    </li>
  );
}

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { CSSProperties } from 'react';

/**
 * Wires one row into a `SortableList`: `attachRow` goes on the row's `ref`, `attachHandle` and
 * `handleProps` on its drag handle. The drag transform is a runtime value, so it travels in CSS
 * variables (the one inline-style exception the styling rules allow).
 */
export function useSortableRow(id: string) {
  const sortable = useSortable({ id });
  return {
    attachRow: sortable.setNodeRef,
    attachHandle: sortable.setActivatorNodeRef,
    handleProps: { ...sortable.attributes, ...sortable.listeners },
    style: {
      '--drag-transform': CSS.Translate.toString(sortable.transform) ?? 'none',
      '--drag-transition': sortable.transition ?? 'none',
    } as CSSProperties,
    className:
      '[transform:var(--drag-transform)] [transition:var(--drag-transition)] data-[dragging=true]:relative data-[dragging=true]:z-10 data-[dragging=true]:bg-gold-soft',
    isDragging: sortable.isDragging,
  };
}

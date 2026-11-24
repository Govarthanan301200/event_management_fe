import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { ReactNode } from 'react';

type SortableListProps = {
  ids: string[];
  /** Name of an item for screen-reader announcements ("Picked up Decor."). */
  nameOf: (id: string) => string;
  onMove: (id: string, overId: string) => void;
  children: ReactNode;
};

/**
 * Drag to reorder (spec §8), by pointer, touch or keyboard: focus a handle, Space to pick up,
 * arrow keys to move, Space to drop, Escape to cancel. Rows use `useSortableRow`.
 * The ⋯ menu's Move up / Move down is the single-pointer alternative (WCAG 2.2, 2.5.7).
 */
export function SortableList({ ids, nameOf, onMove, children }: SortableListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const name = (id: string | number) => nameOf(String(id));
  const position = (id: string | number) =>
    `position ${ids.indexOf(String(id)) + 1} of ${ids.length}`;
  const announcements: Announcements = {
    onDragStart: ({ active }) => `Picked up ${name(active.id)}.`,
    onDragOver: ({ active, over }) =>
      over
        ? `${name(active.id)} moved to ${position(over.id)}.`
        : `${name(active.id)} is not over a position.`,
    onDragEnd: ({ active, over }) =>
      over ? `Dropped ${name(active.id)} at ${position(over.id)}.` : `Dropped ${name(active.id)}.`,
    onDragCancel: ({ active }) => `Cancelled. ${name(active.id)} is back where it was.`,
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (over && active.id !== over.id) onMove(String(active.id), String(over.id));
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      accessibility={{ announcements }}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
    </DndContext>
  );
}

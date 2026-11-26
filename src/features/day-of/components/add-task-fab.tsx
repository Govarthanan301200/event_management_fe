import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

type AddTaskFabProps = { onClick: () => void };

/**
 * Quick add on Today and Upcoming (spec §13, decision 2026-11-26): floats above the phone's tab
 * bar, bottom right within thumb reach; on wider screens it sits in the page header instead.
 */
export function AddTaskFab({ onClick }: AddTaskFabProps) {
  return (
    <Button
      onClick={onClick}
      className="h-12 gap-2 px-5 text-body-touch shadow-overlay max-sm:fixed max-sm:right-4 max-sm:bottom-[calc(5rem+env(safe-area-inset-bottom))] max-sm:z-30 max-sm:rounded-full"
    >
      <Plus className="size-6" strokeWidth={1.5} aria-hidden="true" />
      Add task
    </Button>
  );
}

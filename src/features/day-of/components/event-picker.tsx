import { phoneSheetClass } from '@/components/shared/phone-sheet';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

import type { EventChoice } from '../lib/events';

type EventPickerProps = {
  events: readonly EventChoice[];
  onPick: (eventId: string) => void;
  onClose: () => void;
};

/** Upcoming spans events: pick which one the new task is for (decision 2026-11-26). */
export function EventPicker({ events, onPick, onClose }: EventPickerProps) {
  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent
        side="bottom"
        className={cn('gap-2 rounded-t-lg px-4 sm:mx-auto sm:max-w-md', phoneSheetClass)}
      >
        <SheetHeader className="px-0">
          <SheetTitle className="text-title-serif">Add a task to</SheetTitle>
          <SheetDescription>Events with something in the next two weeks.</SheetDescription>
        </SheetHeader>
        <ul className="flex flex-col gap-2">
          {events.map((event) => (
            <li key={event.id}>
              <Button
                variant="outline"
                className="h-12 w-full justify-start px-4 text-body-touch"
                onClick={() => {
                  onPick(event.id);
                }}
              >
                {event.name}
              </Button>
            </li>
          ))}
        </ul>
      </SheetContent>
    </Sheet>
  );
}

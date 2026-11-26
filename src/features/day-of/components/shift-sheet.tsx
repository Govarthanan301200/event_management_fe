import { useState } from 'react';
import { phoneSheetClass } from '@/components/shared/phone-sheet';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { errorMessage } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import type { AgendaFunction, AgendaTask } from '../api/agenda.schema';
import { useShiftTasks } from '../hooks/use-shift-tasks';
import { MAX_SHIFT_MIN, SHIFT_PRESETS, shiftPreview } from '../lib/shift';

type ShiftSheetProps = {
  fn: AgendaFunction;
  tasks: readonly AgendaTask[];
  online: boolean;
  onClose: () => void;
};

const CUSTOM = 'custom';

/** Spec §14 Shift tasks: the function started late, so its pending timed tasks move later. */
export function ShiftSheet({ fn, tasks, online, onClose }: ShiftSheetProps) {
  const [choice, setChoice] = useState<string>('30');
  const [custom, setCustom] = useState('');
  const shifting = useShiftTasks();
  const minutes = choice === CUSTOM ? Number(custom) : Number(choice);
  const valid = Number.isInteger(minutes) && minutes >= 1 && minutes <= MAX_SHIFT_MIN;
  const preview = shiftPreview(tasks, valid ? minutes : 0);
  const tasksWord =
    preview.moving === 1 ? '1 pending task' : `${String(preview.moving)} pending tasks`;

  let help = `Moves ${tasksWord} with a time · reminders re-arm.`;
  if (!online) help = 'Shifting needs a connection: reminders are rescheduled on the server.';
  else if (!preview.ok)
    help =
      preview.limit === 0
        ? "A task is already at the end of the day, so these can't move later."
        : `⚠ That would push a task past midnight. Shift by at most ${String(preview.limit)} min.`;

  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent
        side="bottom"
        className={cn('gap-4 rounded-t-lg px-4 sm:mx-auto sm:max-w-md', phoneSheetClass)}
      >
        <SheetHeader className="px-0">
          <SheetTitle className="text-title-serif">Shift {fn.name} tasks</SheetTitle>
          <SheetDescription>Running late? Move what's still to do.</SheetDescription>
        </SheetHeader>
        <Field>
          <FieldLabel id="shift-by">Later by</FieldLabel>
          <ToggleGroup
            type="single"
            aria-labelledby="shift-by"
            value={choice}
            onValueChange={(value) => {
              if (value) setChoice(value);
            }}
            className="flex flex-wrap gap-2"
          >
            {SHIFT_PRESETS.map((preset) => (
              <ToggleGroupItem
                key={preset}
                value={String(preset)}
                className="h-12 min-w-16 rounded-full border px-4 text-label data-[state=on]:border-gold data-[state=on]:bg-gold-soft"
              >
                +{preset} min
              </ToggleGroupItem>
            ))}
            <ToggleGroupItem
              value={CUSTOM}
              className="h-12 rounded-full border px-4 text-label data-[state=on]:border-gold data-[state=on]:bg-gold-soft"
            >
              Custom
            </ToggleGroupItem>
          </ToggleGroup>
        </Field>
        {choice === CUSTOM ? (
          <Field>
            <FieldLabel htmlFor="shift-custom">Minutes later</FieldLabel>
            <Input
              id="shift-custom"
              inputMode="numeric"
              className="h-12 text-body-touch"
              value={custom}
              onChange={(e) => {
                setCustom(e.target.value.replace(/\D/g, ''));
              }}
            />
          </Field>
        ) : null}
        <FieldDescription aria-live="polite" className={cn(!preview.ok && 'text-danger')}>
          {help}
        </FieldDescription>
        {shifting.error ? (
          <p role="alert" className="text-label text-danger">
            ⚠ {errorMessage(shifting.error, "Couldn't shift the tasks. Try again.")}
          </p>
        ) : null}
        <SheetFooter className="px-0">
          <Button
            className="h-12 text-body-touch"
            disabled={
              !online || !valid || !preview.ok || preview.moving === 0 || shifting.isPending
            }
            onClick={() => {
              shifting.shift(fn.eventId, fn.id, minutes, onClose);
            }}
          >
            {shifting.isPending
              ? 'Shifting…'
              : `Shift ${preview.moving === 1 ? '1 task' : `${String(preview.moving)} tasks`}`}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

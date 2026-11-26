import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { phoneSheetClass } from '@/components/shared/phone-sheet';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { eventDetailOptions } from '@/features/events';
// Deep import on purpose: the plan feature's components use this feature, so its index would
// make an import cycle. The API module depends on nothing from either.
import { planOptions } from '@/features/plan/api/plan.api';
import { errorMessage } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import type { Task } from '../api/tasks.schema';
import { useCreateTasks, useUpdateTask } from '../hooks/use-tasks';
import { lineOptions } from '../lib/line-options';
import {
  NO_LINE,
  REMIND_OPTIONS,
  remindLabel,
  taskFormSchema,
  toCreateInput,
  toTaskForm,
  toUpdateInput,
  type TaskForm,
  type TaskPreset,
} from '../lib/task-form';
import { FunctionPicker } from './function-picker';

export type TaskDialogMode = { kind: 'add'; preset: TaskPreset } | { kind: 'edit'; task: Task };

type TaskDialogProps = { eventId: string; mode: TaskDialogMode; onClose: () => void };

/**
 * Add or edit a task (spec §13 fields). Opened from S11, S9, S8, Today and Upcoming; mount with a
 * `key` per task. Every task comes from this form: none is ever created without the planner (core
 * rule 8). The event's functions come from its detail query (cached on the workspace tabs).
 */
export function TaskDialog({ eventId, mode, onClose }: TaskDialogProps) {
  const event = useQuery(eventDetailOptions(eventId));
  const functions = event.data?.functions ?? [];
  const plan = useQuery(planOptions(eventId));
  const create = useCreateTasks(eventId);
  const update = useUpdateTask(eventId);
  const form = useForm<TaskForm>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: toTaskForm(mode.kind === 'edit' ? { task: mode.task } : { preset: mode.preset }),
  });
  const { errors } = form.formState;
  const [functionIds, dueTime] = useWatch({
    control: form.control,
    name: ['functionIds', 'dueTime'],
  });
  const lines = lineOptions(plan.data);
  const saving = create.isPending || update.isPending;
  const failure = create.error ?? update.error;

  const onSubmit = form.handleSubmit((values) => {
    if (mode.kind === 'edit') {
      update.mutate(
        { taskId: mode.task.id, input: toUpdateInput(values) },
        {
          onSuccess: () => {
            onClose();
            toast.success('Task saved');
          },
        },
      );
      return;
    }
    create.mutate(toCreateInput(values), {
      onSuccess: (created) => {
        onClose();
        toast.success(created.length === 1 ? 'Task added' : `${created.length} tasks added`);
      },
    });
  });

  const describe = (name: 'title' | 'dueDate') => ({
    'aria-invalid': errors[name] ? true : undefined,
    'aria-describedby': errors[name] ? `task-${name}-error` : undefined,
  });

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className={cn('max-h-[90dvh] overflow-y-auto sm:max-w-lg', phoneSheetClass)}>
        <form noValidate onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-6">
          <DialogHeader>
            <DialogTitle className="text-title-serif">
              {mode.kind === 'edit' ? 'Edit task' : 'Add task'}
            </DialogTitle>
            <DialogDescription>
              A task on a function&apos;s date is on that day&apos;s checklist; any other date makes
              it a pre-event task.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field data-invalid={errors.title ? true : undefined}>
              <FieldLabel htmlFor="task-title">Title</FieldLabel>
              <Input
                id="task-title"
                maxLength={120}
                placeholder="Sound check"
                {...describe('title')}
                {...form.register('title')}
              />
              {errors.title ? (
                <FieldError id="task-title-error">{errors.title.message}</FieldError>
              ) : null}
            </Field>
            {functions.length > 0 ? (
              <FunctionPicker
                functions={functions}
                selected={functionIds}
                multiple={mode.kind === 'add'}
                onChange={(ids) => {
                  form.setValue('functionIds', ids, {
                    shouldValidate: errors.dueDate !== undefined,
                  });
                }}
              />
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2">
              {functionIds.length === 0 ? (
                <Field data-invalid={errors.dueDate ? true : undefined}>
                  <FieldLabel htmlFor="task-dueDate">Date</FieldLabel>
                  <Input
                    id="task-dueDate"
                    type="date"
                    {...describe('dueDate')}
                    {...form.register('dueDate')}
                  />
                  {errors.dueDate ? (
                    <FieldError id="task-dueDate-error">{errors.dueDate.message}</FieldError>
                  ) : null}
                </Field>
              ) : null}
              <Field>
                <FieldLabel htmlFor="task-dueTime">Time (optional)</FieldLabel>
                <Input id="task-dueTime" type="time" {...form.register('dueTime')} />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="task-line">Service (optional)</FieldLabel>
              <Controller
                control={form.control}
                name="serviceLineId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      id="task-line"
                      ref={field.ref}
                      onBlur={field.onBlur}
                      className="h-10 w-full"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      <SelectItem value={NO_LINE}>None (General)</SelectItem>
                      {lines.map((line) => (
                        <SelectItem key={line.id} value={line.id}>
                          {line.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldDescription>Shows the vendor on the task, with their number.</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="task-remind">Reminder</FieldLabel>
              <Controller
                control={form.control}
                name="remindBeforeMin"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={dueTime === ''}
                  >
                    <SelectTrigger
                      id="task-remind"
                      ref={field.ref}
                      onBlur={field.onBlur}
                      className="h-10 w-full"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      {REMIND_OPTIONS.map((minutes) => (
                        <SelectItem key={minutes} value={String(minutes)}>
                          {remindLabel(minutes, true)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldDescription>
                {dueTime === ''
                  ? 'Without a time, the reminder is at 9:00 AM on the day.'
                  : 'One reminder, while the task is still pending.'}
              </FieldDescription>
            </Field>
          </FieldGroup>
          {failure ? (
            <p role="alert" className="text-label text-danger">
              ⚠ {errorMessage(failure, "Couldn't save the task. Try again.")}
            </p>
          ) : null}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost" className="h-10 px-4">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={saving} className="h-10 px-4">
              {saving ? 'Saving…' : submitLabel(mode, functionIds.length)}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function submitLabel(mode: TaskDialogMode, functions: number): string {
  if (mode.kind === 'edit') return 'Save task';
  return functions > 1 ? `Add ${functions} tasks` : 'Add task';
}

import { z } from 'zod';
import type { CreateTaskInput, Task, UpdateTaskInput } from '../api/tasks.schema';

export const NO_LINE = '__none';

/** "Remind before" choices; the stored default is 15 minutes (spec §13). */
export const REMIND_OPTIONS = [0, 5, 10, 15, 30, 60, 120, 1440] as const;

/** "15 min before", "1 hr before"; a task with no time reminds at 9:00 AM that day (spec §13). */
export function remindLabel(minutes: number, hasTime: boolean): string {
  if (!hasTime) return '9:00 AM on the day';
  if (minutes === 0) return 'At the due time';
  if (minutes % 1440 === 0)
    return minutes === 1440 ? '1 day before' : `${minutes / 1440} days before`;
  if (minutes % 60 === 0) return minutes === 60 ? '1 hr before' : `${minutes / 60} hrs before`;
  return `${minutes} min before`;
}

export const taskFormSchema = z
  .object({
    title: z.string().trim().min(1, 'Enter a title').max(120, 'Keep the title to 120 characters'),
    functionIds: z.array(z.string()),
    dueDate: z.string(),
    dueTime: z.string(),
    serviceLineId: z.string(),
    remindBeforeMin: z.string(),
  })
  .superRefine((form, ctx) => {
    if (form.functionIds.length === 0 && form.dueDate === '') {
      ctx.addIssue({
        code: 'custom',
        path: ['dueDate'],
        message: 'Pick a function or enter a date',
      });
    }
  });
export type TaskForm = z.infer<typeof taskFormSchema>;

/** Where a new task starts: S8 pre-fills its line and functions; S9 its function (spec §13). */
export type TaskPreset = { functionIds?: readonly string[]; serviceLineId?: string | null };

export function toTaskForm(source: { task: Task } | { preset: TaskPreset }): TaskForm {
  if ('task' in source) {
    const { task } = source;
    return {
      title: task.title,
      functionIds: task.eventFunctionId ? [task.eventFunctionId] : [],
      dueDate: task.dueDate,
      dueTime: task.dueTime ?? '',
      serviceLineId: task.serviceLineId ?? NO_LINE,
      remindBeforeMin: String(task.remindBeforeMin),
    };
  }
  return {
    title: '',
    functionIds: [...(source.preset.functionIds ?? [])],
    dueDate: '',
    dueTime: '',
    serviceLineId: source.preset.serviceLineId ?? NO_LINE,
    remindBeforeMin: '15',
  };
}

function common(form: TaskForm) {
  return {
    title: form.title.trim(),
    // Picking a function sets the date on the server; the typed date only counts without one.
    dueDate: form.functionIds.length === 0 ? form.dueDate : null,
    dueTime: form.dueTime === '' ? null : form.dueTime,
    serviceLineId: form.serviceLineId === NO_LINE ? null : form.serviceLineId,
    remindBeforeMin: Number(form.remindBeforeMin),
  };
}

export function toCreateInput(form: TaskForm): CreateTaskInput {
  return { ...common(form), eventFunctionIds: form.functionIds };
}

export function toUpdateInput(form: TaskForm): UpdateTaskInput {
  return { ...common(form), eventFunctionId: form.functionIds[0] ?? null };
}

/** Ticking a chip: several in Add (one task per function), at most one in Edit. */
export function toggleFunction(
  selected: readonly string[],
  id: string,
  multiple: boolean,
): string[] {
  if (selected.includes(id)) return selected.filter((value) => value !== id);
  return multiple ? [...selected, id] : [id];
}

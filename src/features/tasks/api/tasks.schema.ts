import { z } from 'zod';

// Mirrors Backend/src/modules/tasks/tasks.schema.ts (spec §13).

export const taskStatusSchema = z.enum(['pending', 'done', 'issue']);
export type TaskStatus = z.infer<typeof taskStatusSchema>;

/** Derived on the server from the due date (core rule 8); never chosen. */
export const taskKindSchema = z.enum(['pre_event', 'day_of', 'after_event']);
export type TaskKind = z.infer<typeof taskKindSchema>;

export const taskSchema = z.object({
  id: z.string(),
  /** Today and Upcoming span events; actions call the task's own event (Module 8). */
  eventId: z.string(),
  eventFunctionId: z.string().nullable(),
  functionName: z.string().nullable(),
  serviceLineId: z.string().nullable(),
  serviceName: z.string().nullable(),
  vendor: z.object({ id: z.string(), name: z.string(), phone: z.string() }).nullable(),
  title: z.string(),
  dueDate: z.iso.date(),
  /** Company-local "HH:MM"; null = any time that day (reminder at 09:00). */
  dueTime: z.string().nullable(),
  remindBeforeMin: z.number().int(),
  status: taskStatusSchema,
  issueNote: z.string().nullable(),
  completedAt: z.coerce.date().nullable(),
  kind: taskKindSchema,
});
export type Task = z.infer<typeof taskSchema>;

export type CreateTaskInput = {
  title: string;
  /** One task per function, dated on it (spec §13); empty = one task on `dueDate`. */
  eventFunctionIds: string[];
  dueDate: string | null;
  dueTime: string | null;
  serviceLineId: string | null;
  remindBeforeMin: number;
};

export type UpdateTaskInput = Omit<CreateTaskInput, 'eventFunctionIds'> & {
  eventFunctionId: string | null;
};

export type StatusChange =
  { status: 'pending' } | { status: 'done' } | { status: 'issue'; issueNote: string };

/**
 * A status change as sent (spec §14 offline sync, decision 2026-11-26): the device time it was
 * made and a key fixed at that moment, so a replay after a flaky connection is applied once and
 * the server keeps the latest change (last write wins).
 */
export type StatusRequest = {
  eventId: string;
  taskId: string;
  change: StatusChange;
  changedAt: string;
  idempotencyKey: string;
};

import { z } from 'zod';
import { taskSchema } from '@/features/tasks';

// Mirrors Backend/src/modules/agenda/agenda.schema.ts (spec §14 Today and Upcoming).

const contactSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string().nullable(),
  phone: z.string(),
});

/** Call (spec §14 "vendor contacts list"): every number, cached for offline use. */
export const agendaVendorSchema = z.object({
  id: z.string(),
  name: z.string(),
  phone: z.string(),
  altPhone: z.string().nullable(),
  contactPerson: z.string().nullable(),
  contacts: z.array(contactSchema),
});
export type AgendaVendor = z.infer<typeof agendaVendorSchema>;

export const agendaTaskSchema = taskSchema.extend({
  eventName: z.string(),
  vendor: agendaVendorSchema.nullable(),
});
export type AgendaTask = z.infer<typeof agendaTaskSchema>;

export const agendaFunctionSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  eventName: z.string(),
  name: z.string(),
  date: z.iso.date(),
  /** Company-local "HH:MM". */
  startTime: z.string(),
  endTime: z.string().nullable(),
  venueName: z.string().nullable(),
});
export type AgendaFunction = z.infer<typeof agendaFunctionSchema>;

export const agendaSchema = z.object({
  timeZone: z.string(),
  today: z.iso.date(),
  from: z.iso.date(),
  to: z.iso.date(),
  functions: z.array(agendaFunctionSchema),
  tasks: z.array(agendaTaskSchema),
});
export type Agenda = z.infer<typeof agendaSchema>;

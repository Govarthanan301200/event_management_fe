import { z } from 'zod';

// Mirrors Backend/src/modules/events/events.schema.ts.

export const eventStatusSchema = z.enum([
  'created',
  'requested',
  'planning',
  'completed',
  'cancelled',
]);
export type EventStatus = z.infer<typeof eventStatusSchema>;

export const eventSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  clientName: z.string(),
  status: eventStatusSchema,
  formSubmittedAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
});
export type EventSummary = z.infer<typeof eventSummarySchema>;

export const eventPageSchema = z.object({
  data: z.array(eventSummarySchema),
  nextCursor: z.string().nullable(),
});

export const eventDetailSchema = eventSummarySchema.extend({
  clientPhone: z.string(),
  clientEmail: z.string().nullable(),
  overallBudget: z.number().int().nullable(),
  formToken: z.string(),
  formLocked: z.boolean(),
  requestedServices: z.array(
    z.object({
      serviceId: z.string(),
      serviceName: z.string(),
      categoryName: z.string(),
      clientNote: z.string().nullable(),
    }),
  ),
});
export type EventDetail = z.infer<typeof eventDetailSchema>;

const phonePattern = /^\+?[0-9 ()-]+$/;

/** S5 minimal create (spec §10). Same rules as the backend's createEventBody. */
export const createEventFormSchema = z.object({
  clientName: z.string().trim().min(1, "Enter the client's name").max(120),
  clientPhone: z
    .string()
    .trim()
    .regex(phonePattern, 'Use digits, spaces and an optional leading +')
    .refine((value) => {
      const digits = value.replace(/\D/g, '').length;
      return digits >= 8 && digits <= 15;
    }, 'Enter a phone number with 8 to 15 digits'),
  clientEmail: z.union([z.literal(''), z.email('Enter a valid email, or leave it empty')]),
  name: z.string().trim().max(120),
});
export type CreateEventForm = z.infer<typeof createEventFormSchema>;

export const STATUS_LABEL: Record<EventStatus, string> = {
  created: 'Created',
  requested: 'Requested',
  planning: 'Planning',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

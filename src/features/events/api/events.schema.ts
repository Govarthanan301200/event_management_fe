import { z } from 'zod';

// Mirrors Backend/src/modules/events/events.schema.ts and event-functions.schema.ts.

export const eventStatusSchema = z.enum([
  'created',
  'requested',
  'planning',
  'completed',
  'cancelled',
]);
export type EventStatus = z.infer<typeof eventStatusSchema>;

export const eventViewSchema = z.enum(['upcoming', 'past']);
export type EventView = z.infer<typeof eventViewSchema>;

export const eventSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  clientName: z.string(),
  status: eventStatusSchema,
  formSubmittedAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  firstFunctionDate: z.string().nullable(),
  lastFunctionDate: z.string().nullable(),
  functionCount: z.number().int(),
});
export type EventSummary = z.infer<typeof eventSummarySchema>;

export const eventPageSchema = z.object({
  data: z.array(eventSummarySchema),
  nextCursor: z.string().nullable(),
});

export const eventFunctionSchema = z.object({
  id: z.string(),
  functionTypeId: z.string().nullable(),
  customName: z.string().nullable(),
  name: z.string(),
  functionTypeArchived: z.boolean(),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string().nullable(),
  venueName: z.string().nullable(),
  venueAddress: z.string().nullable(),
  guestCount: z.number().int(),
  sortOrder: z.number().int(),
});
export type EventFunction = z.infer<typeof eventFunctionSchema>;

export const functionEffectsSchema = z.object({
  paxRowsUpdated: z.number().int(),
  tasksMoved: z.number().int(),
});
export type FunctionEffects = z.infer<typeof functionEffectsSchema>;

export const functionImpactSchema = z.object({
  functionRows: z.number().int(),
  tasks: z.number().int(),
  /** Services this function alone covers: their lines stay, with no functions. */
  emptiedLines: z.array(z.string()),
});
export type FunctionImpact = z.infer<typeof functionImpactSchema>;

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
      /** Spec §6: the event has a service line for this service. */
      planned: z.boolean(),
    }),
  ),
  functions: z.array(eventFunctionSchema),
  /** S6 quick counts: lines on the plan and their planned total (spec §12). */
  plan: z.object({ services: z.number().int(), planned: z.number().int() }),
});
export type EventDetail = z.infer<typeof eventDetailSchema>;

const phonePattern = /^\+?[0-9 ()-]+$/;
const clientPhone = z
  .string()
  .trim()
  .regex(phonePattern, 'Use digits, spaces and an optional leading +')
  .refine((value) => {
    const digits = value.replace(/\D/g, '').length;
    return digits >= 8 && digits <= 15;
  }, 'Enter a phone number with 8 to 15 digits');
const clientName = z.string().trim().min(1, "Enter the client's name").max(120);
const clientEmail = z.union([z.literal(''), z.email('Enter a valid email, or leave it empty')]);

/** S5 minimal create (spec §10). Same rules as the backend's createEventBody. */
export const createEventFormSchema = z.object({
  clientName,
  clientPhone,
  clientEmail,
  name: z.string().trim().max(120),
});
export type CreateEventForm = z.infer<typeof createEventFormSchema>;

/** Whole rupees, typed with or without Indian grouping ("25,00,000"). */
const rupeesPattern = /^\d{1,3}(,\d{2,3})*$|^\d+$/;
export const MAX_BUDGET = 2_147_483_647;

/** S6 Edit details: client details and the overall budget (optional). */
export const eventDetailsFormSchema = z.object({
  name: z.string().trim().min(1, 'Enter an event name').max(120),
  clientName,
  clientPhone,
  clientEmail,
  overallBudget: z
    .string()
    .trim()
    .refine(
      (value) => value === '' || rupeesPattern.test(value),
      'Use whole rupees, like 25,00,000',
    )
    .refine(
      (value) => value === '' || Number(value.replace(/,/g, '')) <= MAX_BUDGET,
      'That amount is too large',
    ),
});
export type EventDetailsForm = z.infer<typeof eventDetailsFormSchema>;

/** Select value for "Other" (no function type, custom name). */
export const OTHER_FUNCTION = 'other';

/** S6 Add / edit function (spec §10 function fields). Inputs hold strings; see toFunctionInput. */
export const functionFormSchema = z
  .object({
    functionTypeId: z.string().min(1, 'Choose a function type, or Other'),
    customName: z.string().trim().max(80),
    date: z.iso.date('Choose a date'),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Enter a start time'),
    endTime: z.union([z.literal(''), z.string().regex(/^\d{2}:\d{2}$/, 'Enter a valid time')]),
    venueName: z.string().trim().max(200),
    venueAddress: z.string().trim().max(500),
    guestCount: z
      .string()
      .trim()
      .regex(/^\d{1,6}$/, 'Enter the number of guests (an estimate is fine)')
      .refine((value) => Number(value) <= 100_000, 'That is more than 1,00,000 guests'),
  })
  .superRefine((values, ctx) => {
    if (values.functionTypeId === OTHER_FUNCTION && values.customName === '') {
      ctx.addIssue({ code: 'custom', path: ['customName'], message: 'Name the function' });
    }
  });
export type FunctionForm = z.infer<typeof functionFormSchema>;

export type FunctionInput = {
  functionTypeId: string | null;
  customName: string | null;
  date: string;
  startTime: string;
  endTime: string | null;
  venueName: string;
  venueAddress: string;
  guestCount: number;
};

export const STATUS_LABEL: Record<EventStatus, string> = {
  created: 'Created',
  requested: 'Requested',
  planning: 'Planning',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

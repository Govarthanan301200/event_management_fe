import { z } from 'zod';

// Mirrors Backend/src/modules/dashboard/dashboard.schema.ts (S13, spec §15).

const progress = { done: z.number().int(), total: z.number().int(), overdue: z.number().int() };

const limited = <T extends z.ZodType>(item: T) =>
  z.object({ total: z.number().int(), items: z.array(item) });

export const dashboardTaskSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  eventName: z.string(),
  functionName: z.string().nullable(),
  title: z.string(),
  dueDate: z.iso.date(),
  dueTime: z.string().nullable(),
  status: z.enum(['pending', 'done', 'issue']),
  issueNote: z.string().nullable(),
});
export type DashboardTask = z.infer<typeof dashboardTaskSchema>;

const categoryOverSchema = z.object({ id: z.string(), name: z.string(), overBy: z.number().int() });
export type CategoryOver = z.infer<typeof categoryOverSchema>;

const eventBudget = {
  eventId: z.string(),
  name: z.string(),
  firstFunctionDate: z.iso.date().nullable(),
  lastFunctionDate: z.iso.date().nullable(),
  planned: z.number().int(),
  overallBudget: z.number().int().nullable(),
  overBy: z.number().int().nullable(),
  categoriesOver: z.array(categoryOverSchema),
};

const todayFunctionSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  eventName: z.string(),
  name: z.string(),
  startTime: z.string(),
  endTime: z.string().nullable(),
  venueName: z.string().nullable(),
  ...progress,
});
export type TodayFunction = z.infer<typeof todayFunctionSchema>;

const todayGeneralSchema = z.object({ eventId: z.string(), eventName: z.string(), ...progress });
export type TodayGeneral = z.infer<typeof todayGeneralSchema>;

const submissionSchema = z.object({
  eventId: z.string(),
  name: z.string(),
  clientName: z.string(),
  formSubmittedAt: z.coerce.date().nullable(),
  requested: z.number().int(),
  notPlanned: z.number().int(),
});
export type Submission = z.infer<typeof submissionSchema>;

const upcomingEventSchema = z.object({ ...eventBudget, openTasks: z.number().int() });
export type UpcomingEvent = z.infer<typeof upcomingEventSchema>;

const overBudgetEventSchema = z.object(eventBudget);
export type OverBudgetEvent = z.infer<typeof overBudgetEventSchema>;

export const dashboardSchema = z.object({
  timeZone: z.string(),
  today: z.iso.date(),
  now: z.string(),
  todayFunctions: z.object({
    functions: z.array(todayFunctionSchema),
    general: z.array(todayGeneralSchema),
    next: z
      .object({
        id: z.string(),
        eventId: z.string(),
        eventName: z.string(),
        name: z.string(),
        date: z.iso.date(),
        startTime: z.string(),
      })
      .nullable(),
  }),
  tasks: z.object({
    issues: limited(dashboardTaskSchema),
    overdue: limited(dashboardTaskSchema),
    thisWeek: limited(dashboardTaskSchema),
  }),
  submissions: limited(submissionSchema),
  upcoming: limited(upcomingEventSchema),
  overBudget: limited(overBudgetEventSchema),
});
export type Dashboard = z.infer<typeof dashboardSchema>;

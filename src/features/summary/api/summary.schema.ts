import { z } from 'zod';

// Mirrors Backend/src/modules/summary/summary.schema.ts: the spec §12 roll-ups, computed on the
// server only (decision 2026-11-26). The FE never re-derives them; S8's live total is the exception.

const amountsSchema = z.record(z.string(), z.number().int());

export const summaryFunctionSchema = z.object({
  id: z.string(),
  name: z.string(),
  date: z.iso.date(),
  startTime: z.string(),
  guestCount: z.number().int(),
  total: z.number().int(),
});
export type SummaryFunction = z.infer<typeof summaryFunctionSchema>;

export const categoryRollupSchema = z.object({
  id: z.string(),
  name: z.string(),
  /** Only functions something is attributed to: a missing key reads "—". */
  byFunction: amountsSchema,
  shared: z.number().int(),
  planned: z.number().int(),
  envelope: z.number().int().nullable(),
  /** Envelope − planned; negative is over. Null without an envelope. */
  left: z.number().int().nullable(),
  over: z.boolean(),
});
export type CategoryRollup = z.infer<typeof categoryRollupSchema>;

export const lineRollupSchema = z.object({
  id: z.string(),
  categoryId: z.string(),
  total: z.number().int(),
  byFunction: amountsSchema,
  /** A line budget on a multi-function (or no-function) line: never split (spec §12). */
  shared: z.number().int(),
});
export type LineRollup = z.infer<typeof lineRollupSchema>;

export const eventMoneySummarySchema = z.object({
  overallBudget: z.number().int().nullable(),
  planned: z.number().int(),
  /** Overall budget − planned; negative is over. Null without an overall budget. */
  left: z.number().int().nullable(),
  over: z.boolean(),
  services: z.number().int(),
  categoriesOver: z.number().int(),
  categoriesWithEnvelope: z.number().int(),
  functions: z.array(summaryFunctionSchema),
  shared: z.number().int(),
  categories: z.array(categoryRollupSchema),
  envelopeTotal: z.number().int().nullable(),
  lines: z.array(lineRollupSchema),
});
export type EventMoneySummary = z.infer<typeof eventMoneySummarySchema>;

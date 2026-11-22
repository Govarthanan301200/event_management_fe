import { z } from 'zod';

export const readinessSchema = z.object({
  status: z.string(),
  checks: z.object({ database: z.boolean() }).optional(),
});

export type Readiness = z.infer<typeof readinessSchema>;

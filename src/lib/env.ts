import { z } from 'zod';

// Only VITE_* variables reach the browser, and they are PUBLIC. Never put secrets here.
const schema = z.object({
  VITE_API_URL: z.url(),
  VITE_APP_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  // Supabase Auth for planner sign-in. The publishable (anon) key is public by design.
  // Optional so the public client form (S1) still works where sign-in isn't configured.
  VITE_SUPABASE_URL: z.url().optional(),
  VITE_SUPABASE_PUBLISHABLE_KEY: z.string().min(1).optional(),
});

export const env = schema.parse(import.meta.env);

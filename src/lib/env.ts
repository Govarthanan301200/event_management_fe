import { z } from 'zod';

// Only VITE_* variables reach the browser, and they are PUBLIC. Never put secrets here.
const schema = z.object({
  VITE_API_URL: z.url(),
  VITE_APP_ENV: z.enum(['development', 'staging', 'production']).default('development'),
});

export const env = schema.parse(import.meta.env);

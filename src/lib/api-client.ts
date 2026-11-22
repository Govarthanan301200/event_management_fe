import type { z } from 'zod';
import { env } from '@/lib/env';

const baseUrl = env.VITE_API_URL.replace(/\/$/, '');

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** GET a JSON endpoint and validate the body with Zod at the boundary. */
export async function apiGet<T extends z.ZodType>(path: string, schema: T): Promise<z.infer<T>> {
  const res = await fetch(`${baseUrl}${path}`, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new ApiError(res.status, `Request failed with status ${res.status}`);
  return schema.parse(await res.json());
}

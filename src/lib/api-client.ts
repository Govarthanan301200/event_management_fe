import { z } from 'zod';
import { env } from '@/lib/env';

const baseUrl = env.VITE_API_URL.replace(/\/$/, '');

/** The backend's error shape: `{ error: { code, message, details?, requestId } }`. */
const errorBody = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
    requestId: z.string().optional(),
  }),
});

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly code = 'UNKNOWN',
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Supabase access token for planner routes; omitted on public routes. */
  token?: string;
  headers?: Record<string, string>;
};

/** Call a JSON endpoint and validate the response body with Zod at the boundary. */
export async function apiRequest<T extends z.ZodType>(
  path: string,
  schema: T,
  options: RequestOptions = {},
): Promise<z.infer<T>> {
  const headers: Record<string, string> = { Accept: 'application/json', ...options.headers };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (options.token) headers.Authorization = `Bearer ${options.token}`;

  const res = await fetch(`${baseUrl}${path}`, {
    method: options.method ?? 'GET',
    headers,
    ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
  });

  const json: unknown = await res.json().catch(() => undefined);
  if (!res.ok) {
    const parsed = errorBody.safeParse(json);
    if (parsed.success) {
      const { code, message, details } = parsed.data.error;
      throw new ApiError(res.status, message, code, details);
    }
    throw new ApiError(res.status, `Request failed with status ${res.status}`);
  }
  return schema.parse(json);
}

/** GET a JSON endpoint and validate the body with Zod at the boundary. */
export function apiGet<T extends z.ZodType>(path: string, schema: T): Promise<z.infer<T>> {
  return apiRequest(path, schema);
}

/** Wraps a successful `{ data }` response body. */
export function dataOf<Out>(schema: z.ZodType<Out>) {
  return z.object({ data: z.unknown() }).transform((body): Out => schema.parse(body.data));
}

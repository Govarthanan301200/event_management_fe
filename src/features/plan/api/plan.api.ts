import { queryOptions } from '@tanstack/react-query';
import { z } from 'zod';
import { getAccessToken } from '@/features/auth/api/supabase';
import { apiRequest, dataOf } from '@/lib/api-client';
import {
  serviceLineSchema,
  servicePlanSchema,
  vendorOptionSchema,
  type LineInput,
} from './plan.schema';

export const planKeys = {
  all: ['plan'] as const,
  event: (eventId: string) => [...planKeys.all, 'event', eventId] as const,
  vendorOptions: (serviceId: string) => [...planKeys.all, 'vendor-options', serviceId] as const,
};

const linesPath = (eventId: string) =>
  `/api/v1/events/${encodeURIComponent(eventId)}/service-lines`;

/** S7: every service line with its rows, plus the category envelopes. */
export function planOptions(eventId: string) {
  return queryOptions({
    queryKey: planKeys.event(eventId),
    queryFn: async () =>
      apiRequest(linesPath(eventId), dataOf(servicePlanSchema), { token: await getAccessToken() }),
  });
}

/** S8 vendor dropdown: vendors offering the service, with their rate for it. */
export function vendorOptionsFor(serviceId: string) {
  return queryOptions({
    queryKey: planKeys.vendorOptions(serviceId),
    queryFn: async () =>
      apiRequest(
        `/api/v1/vendors/offering/${encodeURIComponent(serviceId)}`,
        dataOf(z.array(vendorOptionSchema)),
        { token: await getAccessToken() },
      ),
  });
}

export async function createLine(eventId: string, serviceId: string, input: LineInput) {
  return apiRequest(linesPath(eventId), dataOf(serviceLineSchema), {
    method: 'POST',
    token: await getAccessToken(),
    body: { serviceId, ...input },
  });
}

export async function updateLine(eventId: string, lineId: string, input: LineInput) {
  return apiRequest(
    `${linesPath(eventId)}/${encodeURIComponent(lineId)}`,
    dataOf(serviceLineSchema),
    {
      method: 'PUT',
      token: await getAccessToken(),
      body: input,
    },
  );
}

export async function deleteLine(eventId: string, lineId: string) {
  return apiRequest(`${linesPath(eventId)}/${encodeURIComponent(lineId)}`, z.undefined(), {
    method: 'DELETE',
    token: await getAccessToken(),
  });
}

/** `null` removes the envelope. */
export async function setEnvelope(eventId: string, categoryId: string, amount: number | null) {
  return apiRequest(
    `/api/v1/events/${encodeURIComponent(eventId)}/envelopes/${encodeURIComponent(categoryId)}`,
    dataOf(z.object({ categoryId: z.string(), amount: z.number().int().nullable() })),
    { method: 'PUT', token: await getAccessToken(), body: { amount } },
  );
}

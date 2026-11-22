import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';
import { apiRequest, dataOf } from '@/lib/api-client';
import { getAccessToken } from '@/features/auth/api/supabase';
import { eventDetailSchema, eventPageSchema, type CreateEventForm } from './events.schema';

export const eventsKeys = {
  all: ['events'] as const,
  list: () => [...eventsKeys.all, 'list'] as const,
  detail: (eventId: string) => [...eventsKeys.all, 'detail', eventId] as const,
};

export function eventListOptions() {
  return infiniteQueryOptions({
    queryKey: eventsKeys.list(),
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) =>
      apiRequest(
        `/api/v1/events?limit=20${pageParam ? `&cursor=${encodeURIComponent(pageParam)}` : ''}`,
        eventPageSchema,
        {
          token: await getAccessToken(),
        },
      ),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

export function eventDetailOptions(eventId: string) {
  return queryOptions({
    queryKey: eventsKeys.detail(eventId),
    queryFn: async () =>
      apiRequest(`/api/v1/events/${encodeURIComponent(eventId)}`, dataOf(eventDetailSchema), {
        token: await getAccessToken(),
      }),
  });
}

/** Optional fields are left out rather than sent empty; the server names the event when blank. */
export async function createEvent(values: CreateEventForm) {
  return apiRequest('/api/v1/events', dataOf(eventDetailSchema), {
    method: 'POST',
    token: await getAccessToken(),
    body: {
      clientName: values.clientName,
      clientPhone: values.clientPhone,
      ...(values.clientEmail ? { clientEmail: values.clientEmail } : {}),
      ...(values.name.trim() ? { name: values.name.trim() } : {}),
    },
  });
}

export async function setFormLocked(eventId: string, locked: boolean) {
  return apiRequest(
    `/api/v1/events/${encodeURIComponent(eventId)}/form`,
    dataOf(eventDetailSchema),
    {
      method: 'PATCH',
      token: await getAccessToken(),
      body: { locked },
    },
  );
}

/** The public link the planner shares (spec §7 step 2). */
export function formLinkFor(formToken: string): string {
  return `${window.location.origin}/f/${formToken}`;
}

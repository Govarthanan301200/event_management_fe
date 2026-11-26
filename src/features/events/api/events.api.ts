import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';
import { z } from 'zod';
import { getAccessToken } from '@/features/auth/api/supabase';
import { apiRequest, dataOf } from '@/lib/api-client';
import {
  eventDetailSchema,
  eventFunctionSchema,
  eventPageSchema,
  functionEffectsSchema,
  functionImpactSchema,
  type CreateEventForm,
  type EventView,
  type FunctionInput,
} from './events.schema';

export const eventsKeys = {
  all: ['events'] as const,
  lists: () => [...eventsKeys.all, 'list'] as const,
  list: (view: EventView) => [...eventsKeys.lists(), view] as const,
  detail: (eventId: string) => [...eventsKeys.all, 'detail', eventId] as const,
  impact: (eventId: string, functionId: string) =>
    [...eventsKeys.detail(eventId), 'impact', functionId] as const,
  /**
   * The tasks feature's list (Module 7). Kept here so function edits, which move and unlink
   * tasks (spec §10), can refresh it without `events` importing `tasks`.
   */
  tasks: (eventId: string) => [...eventsKeys.detail(eventId), 'tasks'] as const,
};

const eventPath = (eventId: string) => `/api/v1/events/${encodeURIComponent(eventId)}`;
const functionsPath = (eventId: string) => `${eventPath(eventId)}/functions`;
const functionPath = (eventId: string, functionId: string) =>
  `${functionsPath(eventId)}/${encodeURIComponent(functionId)}`;

/** S5 Upcoming / Past (decision 2026-11-25). */
export function eventListOptions(view: EventView) {
  return infiniteQueryOptions({
    queryKey: eventsKeys.list(view),
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) =>
      apiRequest(
        `/api/v1/events?view=${view}&limit=20${pageParam ? `&cursor=${encodeURIComponent(pageParam)}` : ''}`,
        eventPageSchema,
        { token: await getAccessToken() },
      ),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

export function eventDetailOptions(eventId: string) {
  return queryOptions({
    queryKey: eventsKeys.detail(eventId),
    queryFn: async () =>
      apiRequest(eventPath(eventId), dataOf(eventDetailSchema), { token: await getAccessToken() }),
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

export type EventChange = Partial<{
  name: string;
  clientName: string;
  clientPhone: string;
  /** "" clears the email. */
  clientEmail: string;
  overallBudget: number | null;
}>;

export async function updateEvent(eventId: string, change: EventChange) {
  return apiRequest(eventPath(eventId), dataOf(eventDetailSchema), {
    method: 'PATCH',
    token: await getAccessToken(),
    body: change,
  });
}

/** S6 ⋯ menu. `planning` is Reopen event. */
export type StatusChange = 'completed' | 'cancelled' | 'planning';

export async function changeEventStatus(eventId: string, status: StatusChange) {
  return apiRequest(`${eventPath(eventId)}/status`, dataOf(eventDetailSchema), {
    method: 'PATCH',
    token: await getAccessToken(),
    body: { status },
  });
}

export async function setFormLocked(eventId: string, locked: boolean) {
  return apiRequest(`${eventPath(eventId)}/form`, dataOf(eventDetailSchema), {
    method: 'PATCH',
    token: await getAccessToken(),
    body: { locked },
  });
}

export async function createFunction(eventId: string, input: FunctionInput) {
  return apiRequest(functionsPath(eventId), dataOf(eventFunctionSchema), {
    method: 'POST',
    token: await getAccessToken(),
    body: input,
  });
}

export async function updateFunction(eventId: string, functionId: string, input: FunctionInput) {
  return apiRequest(
    functionPath(eventId, functionId),
    dataOf(z.object({ function: eventFunctionSchema, effects: functionEffectsSchema })),
    { method: 'PATCH', token: await getAccessToken(), body: input },
  );
}

export async function deleteFunction(eventId: string, functionId: string) {
  return apiRequest(functionPath(eventId, functionId), z.undefined(), {
    method: 'DELETE',
    token: await getAccessToken(),
  });
}

export async function reorderFunctions(eventId: string, ids: string[]) {
  return apiRequest(`${functionsPath(eventId)}/order`, z.undefined(), {
    method: 'PUT',
    token: await getAccessToken(),
    body: { ids },
  });
}

/** Counts for the delete warning (spec §10); 0 until Modules 5 and 7. */
export function functionImpactOptions(eventId: string, functionId: string) {
  return queryOptions({
    queryKey: eventsKeys.impact(eventId, functionId),
    queryFn: async () =>
      apiRequest(`${functionPath(eventId, functionId)}/impact`, dataOf(functionImpactSchema), {
        token: await getAccessToken(),
      }),
    staleTime: 0,
  });
}

/** The public link the planner shares (spec §7 step 2). */
export function formLinkFor(formToken: string): string {
  return `${window.location.origin}/f/${formToken}`;
}

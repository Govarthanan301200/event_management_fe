import { queryOptions } from '@tanstack/react-query';
import { z } from 'zod';
import { getAccessToken } from '@/features/auth/api/supabase';
import { eventsKeys } from '@/features/events';
import { apiRequest, dataOf } from '@/lib/api-client';
import {
  taskSchema,
  type CreateTaskInput,
  type StatusRequest,
  type UpdateTaskInput,
} from './tasks.schema';

export const tasksKeys = {
  /** Nested under the event (see `eventsKeys.tasks`), so function edits refresh it. */
  event: (eventId: string) => eventsKeys.tasks(eventId),
  /** Status changes share one key: queued offline, persisted, replayed in order (spec §14). */
  status: () => ['tasks', 'status'] as const,
};

/**
 * Today and Upcoming (spec §14), across events. Here rather than in the day-of feature so every
 * task change can refresh them without this feature importing that one.
 */
export const agendaKeys = {
  all: ['agenda'] as const,
  range: (from: string | null, days: number) => [...agendaKeys.all, from ?? 'today', days] as const,
};

const tasksPath = (eventId: string) => `/api/v1/events/${encodeURIComponent(eventId)}/tasks`;
const taskPath = (eventId: string, taskId: string) =>
  `${tasksPath(eventId)}/${encodeURIComponent(taskId)}`;

/** Every task of the event (S11, the S9 panel, the S7 remove warning). */
export function tasksOptions(eventId: string) {
  return queryOptions({
    queryKey: tasksKeys.event(eventId),
    queryFn: async () =>
      apiRequest(tasksPath(eventId), dataOf(z.array(taskSchema)), {
        token: await getAccessToken(),
      }),
  });
}

export async function createTasks(eventId: string, input: CreateTaskInput) {
  return apiRequest(tasksPath(eventId), dataOf(z.array(taskSchema)), {
    method: 'POST',
    token: await getAccessToken(),
    body: input,
  });
}

export async function updateTask(eventId: string, taskId: string, input: UpdateTaskInput) {
  return apiRequest(taskPath(eventId, taskId), dataOf(taskSchema), {
    method: 'PUT',
    token: await getAccessToken(),
    body: input,
  });
}

/** `meta.applied` (false for a replay or an older change) isn't needed: the refetch shows the result. */
export async function setTaskStatus(request: StatusRequest) {
  const { eventId, taskId, change, changedAt, idempotencyKey } = request;
  return apiRequest(`${taskPath(eventId, taskId)}/status`, dataOf(taskSchema), {
    method: 'PATCH',
    token: await getAccessToken(),
    headers: { 'Idempotency-Key': idempotencyKey },
    body: { ...change, changedAt },
  });
}

export async function deleteTask(eventId: string, taskId: string) {
  return apiRequest(taskPath(eventId, taskId), z.undefined(), {
    method: 'DELETE',
    token: await getAccessToken(),
  });
}

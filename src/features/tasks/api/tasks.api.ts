import { queryOptions } from '@tanstack/react-query';
import { z } from 'zod';
import { getAccessToken } from '@/features/auth/api/supabase';
import { eventsKeys } from '@/features/events';
import { apiRequest, dataOf } from '@/lib/api-client';
import {
  taskSchema,
  type CreateTaskInput,
  type StatusChange,
  type UpdateTaskInput,
} from './tasks.schema';

export const tasksKeys = {
  /** Nested under the event (see `eventsKeys.tasks`), so function edits refresh it. */
  event: (eventId: string) => eventsKeys.tasks(eventId),
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

export async function setTaskStatus(eventId: string, taskId: string, change: StatusChange) {
  return apiRequest(`${taskPath(eventId, taskId)}/status`, dataOf(taskSchema), {
    method: 'PATCH',
    token: await getAccessToken(),
    body: change,
  });
}

export async function deleteTask(eventId: string, taskId: string) {
  return apiRequest(taskPath(eventId, taskId), z.undefined(), {
    method: 'DELETE',
    token: await getAccessToken(),
  });
}

import { queryOptions } from '@tanstack/react-query';
import { z } from 'zod';
import { getAccessToken } from '@/features/auth/api/supabase';
import { agendaKeys, taskSchema } from '@/features/tasks';
import { apiRequest, dataOf } from '@/lib/api-client';
import { agendaSchema } from './agenda.schema';

/** Spec §14: "caches all tasks and contacts for the next 48 hours" (persisted to IndexedDB). */
export const OFFLINE_CACHE_MS = 48 * 60 * 60 * 1000;

/** Today: 2 days from `from` (the 48-hour cache). Upcoming: a wider range. */
export function agendaOptions(from: string, days: number) {
  return queryOptions({
    queryKey: agendaKeys.range(from, days),
    queryFn: async () =>
      apiRequest(
        `/api/v1/agenda?from=${encodeURIComponent(from)}&days=${String(days)}`,
        dataOf(agendaSchema),
        { token: await getAccessToken() },
      ),
    // Kept (and persisted) for the offline window; refetched on open and on every sync.
    gcTime: OFFLINE_CACHE_MS,
    refetchOnWindowFocus: 'always',
  });
}

export type ShiftInput = { eventFunctionId: string; minutes: number; taskIds?: string[] };

/** Spec §14 Shift tasks: returns the tasks that moved (for Undo). */
export async function shiftTasks(eventId: string, input: ShiftInput) {
  return apiRequest(
    `/api/v1/events/${encodeURIComponent(eventId)}/tasks/shift`,
    dataOf(z.array(taskSchema)),
    { method: 'POST', token: await getAccessToken(), body: input },
  );
}

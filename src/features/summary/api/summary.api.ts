import { queryOptions } from '@tanstack/react-query';
import { getAccessToken } from '@/features/auth/api/supabase';
import { apiRequest, dataOf } from '@/lib/api-client';
import { eventMoneySummarySchema } from './summary.schema';

export const summaryKeys = {
  all: ['summary'] as const,
  event: (eventId: string) => [...summaryKeys.all, eventId] as const,
};

/** Spec §12 roll-ups for S6 quick counts, S7 money, S9 and S10. */
export function summaryOptions(eventId: string) {
  return queryOptions({
    queryKey: summaryKeys.event(eventId),
    queryFn: async () =>
      apiRequest(
        `/api/v1/events/${encodeURIComponent(eventId)}/summary`,
        dataOf(eventMoneySummarySchema),
        { token: await getAccessToken() },
      ),
  });
}

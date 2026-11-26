import { queryOptions } from '@tanstack/react-query';
import { getAccessToken } from '@/features/auth/api/supabase';
import { apiRequest, dataOf } from '@/lib/api-client';
import { dashboardSchema } from './dashboard.schema';

/**
 * Its own key, not under `agendaKeys`: the task-status optimistic update rewrites every agenda
 * query's `tasks` array, and the dashboard's `tasks` is an object of groups.
 */
export const dashboardKeys = {
  all: ['dashboard'] as const,
};

/** The dashboard has no edits of its own; a minute is fresh enough for "what needs me now". */
export const DASHBOARD_REFRESH_MS = 60_000;

/** S13 (spec §15): every widget, computed on the server so counts match the data behind them. */
export function dashboardOptions() {
  return queryOptions({
    queryKey: dashboardKeys.all,
    queryFn: async () =>
      apiRequest('/api/v1/dashboard', dataOf(dashboardSchema), { token: await getAccessToken() }),
    refetchOnMount: 'always',
    refetchOnWindowFocus: 'always',
    refetchInterval: DASHBOARD_REFRESH_MS,
  });
}

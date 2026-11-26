import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { agendaOptions } from '../api/agenda.api';
import { addDays, LOOKBACK_DAYS, UPCOMING_DAYS } from '../lib/upcoming';

/**
 * Today plus tomorrow: spec §14's 48-hour offline cache. Past midnight, offline, the previous
 * fetch already holds the new day, so it stays on screen while the new one loads.
 */
export function useTodayAgenda(today: string) {
  return useQuery({ ...agendaOptions(today, 2), placeholderData: keepPreviousData });
}

/** Upcoming: the past week's open tasks, then today and the next 13 days. */
export function useUpcomingAgenda(today: string) {
  return useQuery(agendaOptions(addDays(today, -LOOKBACK_DAYS), LOOKBACK_DAYS + UPCOMING_DAYS));
}

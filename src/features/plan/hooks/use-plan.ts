import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { eventsKeys } from '@/features/events';
import { summaryKeys } from '@/features/summary';
import {
  createLine,
  deleteLine,
  planKeys,
  planOptions,
  setEnvelope,
  updateLine,
} from '../api/plan.api';
import type { LineInput } from '../api/plan.schema';

export function usePlan(eventId: string) {
  return useQuery(planOptions(eventId));
}

/** A plan change also changes the event (status, Planned badges) and every roll-up (spec §12). */
function useRefresh(eventId: string) {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: planKeys.event(eventId) }),
      queryClient.invalidateQueries({ queryKey: eventsKeys.detail(eventId), exact: true }),
      queryClient.invalidateQueries({ queryKey: eventsKeys.lists() }),
      queryClient.invalidateQueries({ queryKey: summaryKeys.event(eventId) }),
      // Tasks show the line's vendor; removing a line unlinks its tasks (decision 2026-11-26).
      queryClient.invalidateQueries({ queryKey: eventsKeys.tasks(eventId) }),
    ]);
}

export function useSaveLine(eventId: string) {
  const refresh = useRefresh(eventId);
  return useMutation({
    mutationFn: (save: { lineId: string | null; serviceId: string; input: LineInput }) =>
      save.lineId === null
        ? createLine(eventId, save.serviceId, save.input)
        : updateLine(eventId, save.lineId, save.input),
    onSuccess: refresh,
  });
}

export function useDeleteLine(eventId: string) {
  const refresh = useRefresh(eventId);
  return useMutation({
    mutationFn: (lineId: string) => deleteLine(eventId, lineId),
    onSuccess: refresh,
  });
}

export function useSetEnvelope(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ categoryId, amount }: { categoryId: string; amount: number | null }) =>
      setEnvelope(eventId, categoryId, amount),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: planKeys.event(eventId) }),
        queryClient.invalidateQueries({ queryKey: summaryKeys.event(eventId) }),
      ]),
  });
}

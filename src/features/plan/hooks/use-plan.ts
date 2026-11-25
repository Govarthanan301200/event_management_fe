import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { eventsKeys } from '@/features/events';
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

/** A plan change also changes the event (status, S6 quick counts, Planned badges). */
function useRefresh(eventId: string) {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: planKeys.event(eventId) }),
      queryClient.invalidateQueries({ queryKey: eventsKeys.detail(eventId), exact: true }),
      queryClient.invalidateQueries({ queryKey: eventsKeys.lists() }),
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: planKeys.event(eventId) }),
  });
}

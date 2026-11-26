import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createFunction,
  deleteFunction,
  eventsKeys,
  reorderFunctions,
  updateFunction,
} from '../api/events.api';
import type { EventDetail, FunctionInput } from '../api/events.schema';
import { summaryKeys } from '@/features/summary';
import { sortByIds } from '@/lib/order';

/**
 * Functions change the event's status and dates, so refresh the event and both S5 lists. They are
 * also the summary's columns, and a delete moves money (a line left with one function, or none).
 */
function useRefreshEvent(eventId: string) {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: eventsKeys.detail(eventId), exact: true }),
      queryClient.invalidateQueries({ queryKey: eventsKeys.lists() }),
      queryClient.invalidateQueries({ queryKey: summaryKeys.event(eventId) }),
      // A date change moves linked tasks; a delete unlinks them (spec §10).
      queryClient.invalidateQueries({ queryKey: eventsKeys.tasks(eventId) }),
    ]);
}

export function useCreateFunction(eventId: string) {
  const refresh = useRefreshEvent(eventId);
  return useMutation({
    mutationFn: (input: FunctionInput) => createFunction(eventId, input),
    onSuccess: refresh,
  });
}

export function useUpdateFunction(eventId: string) {
  const refresh = useRefreshEvent(eventId);
  return useMutation({
    mutationFn: ({ functionId, input }: { functionId: string; input: FunctionInput }) =>
      updateFunction(eventId, functionId, input),
    onSuccess: refresh,
  });
}

export function useDeleteFunction(eventId: string) {
  const refresh = useRefreshEvent(eventId);
  return useMutation({
    mutationFn: (functionId: string) => deleteFunction(eventId, functionId),
    onSuccess: refresh,
  });
}

/** Drag to reorder: the new order shows at once and rolls back if the save fails. */
export function useReorderFunctions(eventId: string) {
  const queryClient = useQueryClient();
  const key = eventsKeys.detail(eventId);
  return useMutation({
    mutationFn: (ids: string[]) => reorderFunctions(eventId, ids),
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: key, exact: true });
      const previous = queryClient.getQueryData<EventDetail>(key);
      if (previous) {
        queryClient.setQueryData<EventDetail>(key, {
          ...previous,
          functions: sortByIds(previous.functions, ids),
        });
      }
      return { previous };
    },
    onError: (_error, _ids, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
    // The summary's columns follow the function order.
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: key, exact: true }),
        queryClient.invalidateQueries({ queryKey: summaryKeys.event(eventId) }),
      ]),
  });
}

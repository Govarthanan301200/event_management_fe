import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  changeEventStatus,
  createEvent,
  eventsKeys,
  setFormLocked,
  updateEvent,
  type EventChange,
  type StatusChange,
} from '../api/events.api';
import type { EventDetail } from '../api/events.schema';
import { summaryKeys } from '@/features/summary';

/**
 * Saves the returned event into the cache; lists re-sort on their next view. The overall budget
 * feeds the summary's Left figure, so that refreshes too.
 */
function useStoreEvent() {
  const queryClient = useQueryClient();
  return async (event: EventDetail) => {
    queryClient.setQueryData(eventsKeys.detail(event.id), event);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: eventsKeys.lists() }),
      queryClient.invalidateQueries({ queryKey: summaryKeys.event(event.id) }),
    ]);
  };
}

export function useCreateEvent() {
  const store = useStoreEvent();
  return useMutation({ mutationFn: createEvent, onSuccess: store });
}

export function useSetFormLocked(eventId: string) {
  const store = useStoreEvent();
  return useMutation({
    mutationFn: (locked: boolean) => setFormLocked(eventId, locked),
    onSuccess: store,
  });
}

/** S6 Edit details. */
export function useUpdateEvent(eventId: string) {
  const store = useStoreEvent();
  return useMutation({
    mutationFn: (change: EventChange) => updateEvent(eventId, change),
    onSuccess: store,
  });
}

/** S6 ⋯ menu: Mark completed, Cancel event, Reopen event. */
export function useChangeEventStatus(eventId: string) {
  const store = useStoreEvent();
  return useMutation({
    mutationFn: (status: StatusChange) => changeEventStatus(eventId, status),
    onSuccess: store,
  });
}

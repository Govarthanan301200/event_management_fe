import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createEvent, eventsKeys, setFormLocked } from '../api/events.api';

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createEvent,
    onSuccess: async (event) => {
      queryClient.setQueryData(eventsKeys.detail(event.id), event);
      await queryClient.invalidateQueries({ queryKey: eventsKeys.list() });
    },
  });
}

export function useSetFormLocked(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (locked: boolean) => setFormLocked(eventId, locked),
    onSuccess: (event) => {
      queryClient.setQueryData(eventsKeys.detail(eventId), event);
    },
  });
}

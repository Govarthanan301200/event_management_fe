import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { eventsKeys } from '@/features/events';
import { agendaKeys, setTaskStatus, tasksKeys } from '../api/tasks.api';
import type { StatusChange, StatusRequest, Task } from '../api/tasks.schema';
import { applyStatus, statusRequest } from '../lib/status-sync';

type Snapshot = [readonly unknown[], unknown][];

/** Every cached list a task shows in: the event's (S6–S11) and Today / Upcoming. */
function patchCaches(queryClient: QueryClient, request: StatusRequest): Snapshot {
  const lists = queryClient.getQueriesData<Task[]>({ queryKey: tasksKeys.event(request.eventId) });
  const agendas = queryClient.getQueriesData<{ tasks: Task[] }>({ queryKey: agendaKeys.all });
  queryClient.setQueriesData<Task[]>(
    { queryKey: tasksKeys.event(request.eventId), exact: true },
    (old) => old?.map((task) => applyStatus(task, request)),
  );
  queryClient.setQueriesData<{ tasks: Task[] }>({ queryKey: agendaKeys.all }, (old) =>
    old ? { ...old, tasks: old.tasks.map((task) => applyStatus(task, request)) } : old,
  );
  return [...lists, ...agendas];
}

/**
 * Refetch once the last queued change has gone: refetching between two queued changes would
 * briefly show the server's older state. S6's open-task count rides on the event detail.
 */
function refreshAfter(queryClient: QueryClient, eventId: string) {
  if (queryClient.isMutating({ mutationKey: tasksKeys.status() }) > 1) return Promise.resolve();
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: tasksKeys.event(eventId) }),
    queryClient.invalidateQueries({ queryKey: eventsKeys.detail(eventId), exact: true }),
    queryClient.invalidateQueries({ queryKey: agendaKeys.all }),
  ]);
}

/** One status change at a time, in order, so a replay keeps the order they were made in. */
const statusScope = { id: 'task-status' };

/**
 * For changes persisted while offline and resumed after a reload (spec §14): the hook's own
 * options are gone by then, so the client needs to know how to send them. Call once at start-up.
 */
export function registerTaskStatusDefaults(queryClient: QueryClient) {
  queryClient.setMutationDefaults(tasksKeys.status(), {
    mutationFn: setTaskStatus,
    scope: statusScope,
    onSettled: (_data, _error, request: StatusRequest) =>
      refreshAfter(queryClient, request.eventId),
  });
}

type Callbacks = { onSuccess?: () => void; onError?: (error: Error) => void };

/**
 * Pending, Done, or Issue for any event's task (S11, S9, Today, Upcoming). Shown at once and
 * rolled back on a refusal. Offline the change waits (paused, persisted to IndexedDB) and is sent
 * on reconnect with its device time and key: last write wins, a replay is a no-op (spec §14).
 */
export function useTaskStatus() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationKey: tasksKeys.status(),
    mutationFn: setTaskStatus,
    scope: statusScope,
    onMutate: async (request: StatusRequest) => {
      await queryClient.cancelQueries({ queryKey: tasksKeys.event(request.eventId), exact: true });
      await queryClient.cancelQueries({ queryKey: agendaKeys.all });
      return patchCaches(queryClient, request);
    },
    onError: (_error, _request, snapshot) => {
      for (const [key, data] of snapshot ?? []) queryClient.setQueryData(key, data);
    },
    onSettled: (_data, _error, request) => refreshAfter(queryClient, request.eventId),
  });
  return {
    mutate: (
      target: { eventId: string; taskId: string },
      change: StatusChange,
      callbacks: Callbacks = {},
    ) => {
      mutation.mutate(statusRequest(target, change), callbacks);
    },
    /** Waiting for the server while online; a queued offline change isn't "saving". */
    isPending: mutation.isPending && !mutation.isPaused,
    isError: mutation.isError,
    error: mutation.error,
  };
}

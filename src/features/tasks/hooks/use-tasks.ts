import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { eventsKeys } from '@/features/events';
import {
  agendaKeys,
  createTasks,
  deleteTask,
  tasksKeys,
  tasksOptions,
  updateTask,
} from '../api/tasks.api';
import type { CreateTaskInput, UpdateTaskInput } from '../api/tasks.schema';

export function useTasks(eventId: string) {
  return useQuery(tasksOptions(eventId));
}

/**
 * A task change also changes S6's open-task count, which rides on the event detail, and Today
 * and Upcoming (Module 8).
 */
function useRefresh(eventId: string) {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: tasksKeys.event(eventId) }),
      queryClient.invalidateQueries({ queryKey: eventsKeys.detail(eventId), exact: true }),
      queryClient.invalidateQueries({ queryKey: agendaKeys.all }),
    ]);
}

export function useCreateTasks(eventId: string) {
  const refresh = useRefresh(eventId);
  return useMutation({
    mutationFn: (input: CreateTaskInput) => createTasks(eventId, input),
    onSuccess: refresh,
  });
}

export function useUpdateTask(eventId: string) {
  const refresh = useRefresh(eventId);
  return useMutation({
    mutationFn: ({ taskId, input }: { taskId: string; input: UpdateTaskInput }) =>
      updateTask(eventId, taskId, input),
    onSuccess: refresh,
  });
}

export function useDeleteTask(eventId: string) {
  const refresh = useRefresh(eventId);
  return useMutation({
    mutationFn: (taskId: string) => deleteTask(eventId, taskId),
    onSuccess: refresh,
  });
}

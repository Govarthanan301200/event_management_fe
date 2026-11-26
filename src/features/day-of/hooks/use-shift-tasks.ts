import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { agendaKeys, tasksKeys } from '@/features/tasks';
import { shiftTasks, type ShiftInput } from '../api/agenda.api';
import { shiftedMessage } from '../lib/shift';

type ShiftVariables = { eventId: string; input: ShiftInput };

/**
 * Spec §14 Shift tasks: needs the network (the server re-arms reminders). Says what moved, with
 * Undo for 5 seconds: the same tasks, moved back.
 */
export function useShiftTasks() {
  const queryClient = useQueryClient();
  const refresh = (eventId: string) =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: agendaKeys.all }),
      queryClient.invalidateQueries({ queryKey: tasksKeys.event(eventId) }),
    ]);
  const mutation = useMutation({
    mutationFn: ({ eventId, input }: ShiftVariables) => shiftTasks(eventId, input),
    onSuccess: (_moved, { eventId }) => refresh(eventId),
    networkMode: 'always',
  });

  const shift = (eventId: string, eventFunctionId: string, minutes: number, onDone: () => void) => {
    mutation.mutate(
      { eventId, input: { eventFunctionId, minutes } },
      {
        onSuccess: (moved) => {
          onDone();
          if (moved.length === 0) {
            toast.success('Nothing to move: no pending task has a time');
            return;
          }
          toast.success(shiftedMessage(moved.length, minutes), {
            duration: 5000,
            action: {
              label: 'Undo',
              onClick: () => {
                mutation.mutate({
                  eventId,
                  input: {
                    eventFunctionId,
                    minutes: -minutes,
                    taskIds: moved.map((task) => task.id),
                  },
                });
              },
            },
          });
        },
      },
    );
  };

  return { shift, isPending: mutation.isPending, error: mutation.error, reset: mutation.reset };
}

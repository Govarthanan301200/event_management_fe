import { onlineManager, useMutationState } from '@tanstack/react-query';
import { useSyncExternalStore } from 'react';
import { tasksKeys } from '@/features/tasks';

/**
 * Online or not (TanStack's onlineManager, fed by the browser), and how many status changes are
 * waiting to sync (paused mutations, persisted to IndexedDB). Spec §14 offline.
 */
export function useConnectivity() {
  const online = useSyncExternalStore(
    (onChange) => onlineManager.subscribe(onChange),
    () => onlineManager.isOnline(),
  );
  const waiting = useMutationState({
    filters: { mutationKey: tasksKeys.status(), predicate: (mutation) => mutation.state.isPaused },
    select: (mutation) => mutation.mutationId,
  }).length;
  return { online, waiting };
}

import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import type { PersistQueryClientOptions } from '@tanstack/react-query-persist-client';
import { del, get, set } from 'idb-keyval';
import { agendaKeys, tasksKeys } from '@/features/tasks';
import { OFFLINE_CACHE_MS } from '../api/agenda.api';

// Spec §14 offline: Today's and Upcoming's tasks and contacts, and status changes made offline,
// kept in IndexedDB on this device for 48 hours (decision 2026-11-26).

const STORE_KEY = 'wp.offline-cache';

const persister = createAsyncStoragePersister({
  storage: {
    getItem: (key) => get<string>(key).then((value) => value ?? null),
    setItem: (key, value: string) => set(key, value),
    removeItem: (key) => del(key),
  },
  key: STORE_KEY,
  throttleTime: 1000,
});

/** What survives a reload: the agenda queries and the status changes still waiting to sync. */
export const offlinePersistOptions: Omit<PersistQueryClientOptions, 'queryClient'> = {
  persister,
  maxAge: OFFLINE_CACHE_MS,
  // A new app version may change shapes: drop the cache rather than show a broken day.
  buster: 'module-8-v1',
  dehydrateOptions: {
    shouldDehydrateQuery: (query) =>
      query.queryKey[0] === agendaKeys.all[0] && query.state.status === 'success',
    shouldDehydrateMutation: (mutation) =>
      mutation.state.isPaused && mutation.options.mutationKey?.[0] === tasksKeys.status()[0],
  },
};

/** Sign-out: client and vendor phones (DPDP personal data) leave the device with the session. */
export function clearOfflineCache(): Promise<void> {
  return del(STORE_KEY);
}

/** IndexedDB exists in browsers, not in every test runner. */
export const canPersist = typeof indexedDB !== 'undefined';

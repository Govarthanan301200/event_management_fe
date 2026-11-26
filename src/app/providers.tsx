import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import type { ReactNode } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { SessionProvider } from '@/features/auth';
import { canPersist, offlinePersistOptions } from '@/features/day-of';
import { registerTaskStatusDefaults } from '@/features/tasks';

const queryClient = new QueryClient();
// Status changes queued offline and restored after a reload know how to send themselves.
registerTaskStatusDefaults(queryClient);

type Props = { children: ReactNode };

/**
 * Spec §14 offline: Today's and Upcoming's data and the status changes still to sync are kept in
 * IndexedDB; once restored, queued changes are sent (in order, last write wins on the server).
 */
export function Providers({ children }: Props) {
  const body = (
    <SessionProvider>
      {children}
      <Toaster position="bottom-center" offset={{ bottom: 88 }} mobileOffset={{ bottom: 88 }} />
    </SessionProvider>
  );
  if (!canPersist) return <QueryClientProvider client={queryClient}>{body}</QueryClientProvider>;
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={offlinePersistOptions}
      onSuccess={() => void queryClient.resumePausedMutations()}
    >
      {body}
    </PersistQueryClientProvider>
  );
}

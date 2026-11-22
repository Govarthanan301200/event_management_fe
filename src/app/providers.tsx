import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { SessionProvider } from '@/features/auth';

const queryClient = new QueryClient();

type Props = { children: ReactNode };

export function Providers({ children }: Props) {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        {children}
        <Toaster position="bottom-center" />
      </SessionProvider>
    </QueryClientProvider>
  );
}

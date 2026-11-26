import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { Toaster } from '@/components/ui/sonner';
import { registerTaskStatusDefaults } from '@/features/tasks';
import { TodayPage } from '../components/today-page';
import { UpcomingPage } from '../components/upcoming-page';

/** Renders Today and Upcoming at `path`, with the app's status-change defaults. */
export function renderDayOf(path = '/today') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  registerTaskStatusDefaults(queryClient);
  const router = createMemoryRouter(
    [
      { path: '/today', element: <TodayPage /> },
      { path: '/upcoming', element: <UpcomingPage /> },
    ],
    { initialEntries: [path] },
  );
  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster />
    </QueryClientProvider>,
  );
  return { router, queryClient };
}

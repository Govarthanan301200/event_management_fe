import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { Toaster } from '@/components/ui/sonner';
import { PlanPage } from '@/features/plan';
import { EventOverviewPage } from '../components/event-overview-page';
import { EventsPage } from '../components/events-page';
import { EventWorkspace } from '../components/event-workspace';

/** Renders S5 and the event workspace (S6, S7) at `path`, with the app's nested routes and a fresh cache. */
export function renderEvents(path: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const router = createMemoryRouter(
    [
      { path: '/events', element: <EventsPage /> },
      {
        path: '/events/:eventId',
        element: <EventWorkspace />,
        children: [
          { index: true, element: <EventOverviewPage /> },
          { path: 'plan', element: <PlanPage /> },
        ],
      },
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

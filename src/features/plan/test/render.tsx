import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { Toaster } from '@/components/ui/sonner';
import { EventOverviewPage, EventWorkspace } from '@/features/events';
import { PlanPage } from '../components/plan-page';

/** Renders the event workspace (S6 + S7) at `path`, like the app's nested routes. */
export function renderPlan(path = '/events/e1/plan') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const router = createMemoryRouter(
    [
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
  return { router };
}

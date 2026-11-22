import { createBrowserRouter, Navigate } from 'react-router';
import { RequireAuth, SignInPage } from '@/features/auth';
import { ClientFormPage } from '@/features/client-form';
import { EventOverviewPage, EventsPage } from '@/features/events';
import { NotFoundPage } from './not-found-page';
import { PlannerLayout } from './planner-layout';

export const routes = [
  // Public client form (spec §3: /f/{form_token}), outside the planner shell and auth.
  { path: '/f/:token', element: <ClientFormPage /> },
  { path: '/sign-in', element: <SignInPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <PlannerLayout />,
        children: [
          { index: true, element: <Navigate to="/events" replace /> },
          { path: '/events', element: <EventsPage /> },
          { path: '/events/:eventId', element: <EventOverviewPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
];

export const router = createBrowserRouter(routes);

import { createBrowserRouter, Navigate } from 'react-router';
import { RequireAuth, SignInPage } from '@/features/auth';
import { CataloguePage, FunctionTypesPage } from '@/features/catalogue';
import { ClientFormPage } from '@/features/client-form';
import { EventOverviewPage, EventsPage, EventWorkspace } from '@/features/events';
import { ByFunctionPage, PlanPage, SummaryPage } from '@/features/plan';
import { TasksPage } from '@/features/tasks';
import {
  EditVendorPage,
  NewVendorPage,
  VendorDirectoryPage,
  VendorProfilePage,
} from '@/features/vendors';
import { NotFoundPage } from './not-found-page';
import { PlannerLayout } from './planner-layout';
import { SettingsLayout } from './settings-layout';

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
          {
            // Spec §3 event workspace: Overview (S6), Plan by category (S7), By function (S9),
            // Summary (S10) and Tasks (S11) tabs.
            path: '/events/:eventId',
            element: <EventWorkspace />,
            children: [
              { index: true, element: <EventOverviewPage /> },
              { path: 'plan', element: <PlanPage /> },
              { path: 'by-function', element: <ByFunctionPage /> },
              { path: 'summary', element: <SummaryPage /> },
              { path: 'tasks', element: <TasksPage /> },
            ],
          },
          // Spec §9: S3 directory and S4 profile / edit.
          { path: '/vendors', element: <VendorDirectoryPage /> },
          { path: '/vendors/new', element: <NewVendorPage /> },
          { path: '/vendors/:vendorId', element: <VendorProfilePage /> },
          { path: '/vendors/:vendorId/edit', element: <EditVendorPage /> },
          {
            path: '/settings',
            element: <SettingsLayout />,
            children: [
              { index: true, element: <Navigate to="/settings/catalogue" replace /> },
              { path: 'catalogue', element: <CataloguePage /> },
              { path: 'function-types', element: <FunctionTypesPage /> },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
];

export const router = createBrowserRouter(routes);

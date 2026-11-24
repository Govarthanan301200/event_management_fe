import { createBrowserRouter, Navigate } from 'react-router';
import { RequireAuth, SignInPage } from '@/features/auth';
import { CataloguePage, FunctionTypesPage } from '@/features/catalogue';
import { ClientFormPage } from '@/features/client-form';
import { EventOverviewPage, EventsPage } from '@/features/events';
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
          { path: '/events/:eventId', element: <EventOverviewPage /> },
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

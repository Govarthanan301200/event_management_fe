import { createBrowserRouter, Navigate } from 'react-router';
import { RequireAuth, SignInPage } from '@/features/auth';
import { CataloguePage, FunctionTypesPage } from '@/features/catalogue';
import { ClientFormPage } from '@/features/client-form';
import { DashboardPage } from '@/features/dashboard';
import { TodayPage, UpcomingPage } from '@/features/day-of';
import { EventOverviewPage, EventsPage, EventWorkspace } from '@/features/events';
import { ByFunctionPage, PlanPage, SummaryPage } from '@/features/plan';
import { RoomsPage } from '@/features/rooms';
import { TasksPage } from '@/features/tasks';
import {
  EditVendorPage,
  NewVendorPage,
  VendorDirectoryPage,
  VendorProfilePage,
} from '@/features/vendors';
import { HomeRedirect } from './home-redirect';
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
          { index: true, element: <HomeRedirect /> },
          // Spec §15 S13: home on the web; on phones it sits in the ⋯ menu (decision 2026-11-26).
          { path: '/dashboard', element: <DashboardPage /> },
          // Spec §14 planner mobile app (S12 Today, Upcoming); responsive, every width.
          { path: '/today', element: <TodayPage /> },
          { path: '/upcoming', element: <UpcomingPage /> },
          { path: '/events', element: <EventsPage /> },
          {
            // Spec §3 event workspace: Overview (S6), Plan by category (S7, with S14 under it),
            // By function (S9), Summary (S10) and Tasks (S11) tabs.
            path: '/events/:eventId',
            element: <EventWorkspace />,
            children: [
              { index: true, element: <EventOverviewPage /> },
              { path: 'plan', element: <PlanPage /> },
              // Spec §3: Rooms and guests (S14) sits under Plan, opened from a line (decision 2026-11-27).
              { path: 'plan/rooms', element: <RoomsPage /> },
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

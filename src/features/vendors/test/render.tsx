import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { Toaster } from '@/components/ui/sonner';
import { EditVendorPage, NewVendorPage } from '../components/vendor-form-page';
import { VendorDirectoryPage } from '../components/vendor-directory-page';
import { VendorProfilePage } from '../components/vendor-profile-page';

/** Renders the vendor screens at `path` (so links between them work) with a fresh cache. */
export function renderVendors(path: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const router = createMemoryRouter(
    [
      { path: '/vendors', element: <VendorDirectoryPage /> },
      { path: '/vendors/new', element: <NewVendorPage /> },
      { path: '/vendors/:vendorId', element: <VendorProfilePage /> },
      { path: '/vendors/:vendorId/edit', element: <EditVendorPage /> },
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

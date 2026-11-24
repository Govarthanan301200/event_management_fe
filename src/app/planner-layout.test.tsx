import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { PlannerLayout } from './planner-layout';

vi.mock('@/features/auth', () => ({ signOut: () => Promise.resolve() }));

function renderAt(path: string) {
  const router = createMemoryRouter(
    [{ element: <PlannerLayout />, children: [{ path: '*', element: <p>Page</p> }] }],
    { initialEntries: [path] },
  );
  render(
    <QueryClientProvider client={new QueryClient()}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

describe('planner sidebar (spec §3, decision 2026-11-24)', () => {
  it('lists Events, Vendors and Settings, and marks the current section', () => {
    renderAt('/vendors/v-1');
    const nav = screen.getByRole('navigation', { name: 'Main' });
    expect(
      within(nav)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['Events', 'Vendors', 'Settings']);
    expect(within(nav).getByRole('link', { name: 'Vendors' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(within(nav).getByRole('link', { name: 'Events' })).not.toHaveAttribute('aria-current');
  });

  it('has no Dashboard or Inventory until those modules are built', () => {
    renderAt('/events');
    expect(screen.queryByRole('link', { name: /dashboard|inventory/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument();
  });
});

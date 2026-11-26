import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { PlannerLayout } from './planner-layout';

vi.mock('@/features/auth', () => ({ signOut: () => Promise.resolve() }));
vi.mock('@/features/auth/api/supabase', () => ({ getAccessToken: () => Promise.resolve('t') }));

// The tab bar's overdue count reads Today's agenda: one task overdue at 16:45 IST.
const server = setupServer(
  http.get('http://api.test/api/v1/agenda', () =>
    HttpResponse.json({
      data: {
        timeZone: 'Asia/Kolkata',
        today: '2099-02-14',
        from: '2099-02-14',
        to: '2099-02-15',
        functions: [],
        tasks: [
          {
            id: 't1',
            eventId: 'e1',
            eventName: 'Ananya & Rohan',
            eventFunctionId: null,
            functionName: null,
            serviceLineId: null,
            serviceName: null,
            vendor: null,
            title: 'Stage decor complete',
            dueDate: '2099-02-14',
            dueTime: '16:30',
            remindBeforeMin: 15,
            status: 'pending',
            issueNote: null,
            completedAt: null,
            kind: 'day_of',
          },
        ],
      },
    }),
  ),
);
beforeAll(() => {
  server.listen({ onUnhandledFrame: 'error' });
});
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2099-02-14T11:15:00Z'));
});
afterEach(() => {
  vi.useRealTimers();
});
afterAll(() => {
  server.close();
});

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

describe('planner sidebar (spec §3, decisions 2026-11-24 and 2026-11-26)', () => {
  it('lists Dashboard first, then Events, Today, Upcoming, Vendors and Services, marking the current one', () => {
    renderAt('/vendors/v-1');
    const nav = screen.getByRole('navigation', { name: 'Main' });
    expect(
      within(nav)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['Dashboard', 'Events', 'Today', 'Upcoming', 'Vendors', 'Services']);
    expect(within(nav).getByRole('link', { name: 'Vendors' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(within(nav).getByRole('link', { name: 'Events' })).not.toHaveAttribute('aria-current');
  });

  it('links Dashboard to /dashboard, and has no Inventory until Module 10 is built', () => {
    renderAt('/dashboard');
    const nav = screen.getByRole('navigation', { name: 'Main' });
    expect(within(nav).getByRole('link', { name: 'Dashboard' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.queryByRole('link', { name: /inventory/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument();
  });
});

describe('phone tab bar (spec §3 mobile app, decision 2026-11-26)', () => {
  it('has Today · Upcoming · Events, marks the current tab, and counts overdue on Today', async () => {
    renderAt('/upcoming');
    const bar = screen.getByRole('navigation', { name: 'Day of' });
    expect(
      within(bar)
        .getAllByRole('link')
        .map((link) => link.getAttribute('href')),
    ).toEqual(['/today', '/upcoming', '/events']);
    expect(within(bar).getByRole('link', { name: /Upcoming/ })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(await within(bar).findByRole('link', { name: 'Today, 1 overdue' })).toBeInTheDocument();
  });

  it('keeps Dashboard, Vendors, Services and Sign out in the phone top bar menu', async () => {
    renderAt('/today');
    vi.useRealTimers(); // user-event waits on real timers
    await userEvent.setup().click(screen.getByRole('button', { name: 'More' }));
    const menu = await screen.findByRole('menu');
    expect(
      within(menu)
        .getAllByRole('menuitem')
        .map((item) => item.textContent),
    ).toEqual(['Dashboard', 'Vendors', 'Services', 'Sign out']);
    expect(within(menu).getByRole('menuitem', { name: 'Dashboard' })).toHaveAttribute(
      'href',
      '/dashboard',
    );
  });
});

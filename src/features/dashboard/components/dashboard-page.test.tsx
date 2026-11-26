import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Dashboard } from '../api/dashboard.schema';
import {
  ANANYA,
  busyDashboard,
  dashboardHandler,
  DIVYA,
  MEERA,
  quietDashboard,
} from '../test/fixtures';
import { DashboardPage } from './dashboard-page';

vi.mock('@/features/auth/api/supabase', () => ({
  getAccessToken: () => Promise.resolve('test-token'),
}));

const server = setupServer();
beforeAll(() => {
  server.listen({ onUnhandledFrame: 'error' });
});
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2099-02-14T11:15:00Z')); // 16:45 IST, Sat 14 Feb 2099
});
afterEach(() => {
  server.resetHandlers();
  vi.useRealTimers();
});
afterAll(() => {
  server.close();
});

function renderDashboard(data: () => Dashboard | Response) {
  const { handler, calls } = dashboardHandler(data);
  server.use(handler);
  const router = createMemoryRouter(
    [
      { path: '/dashboard', element: <DashboardPage /> },
      { path: '/events/:eventId/tasks', element: <p>Tasks tab</p> },
      { path: '*', element: <p>Elsewhere</p> },
    ],
    { initialEntries: ['/dashboard'] },
  );
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return { router, calls };
}

const widget = async (name: RegExp | string) => screen.findByRole('region', { name });

describe('S13 Dashboard (spec §15)', () => {
  it('greets in company time with the date, and shows a skeleton while loading', async () => {
    renderDashboard(busyDashboard);
    expect(screen.getByLabelText('Loading the dashboard')).toHaveAttribute('aria-busy', 'true');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Good afternoon' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Sat 14 Feb 2099')).toBeInTheDocument();
  });

  it('Today: progress, overdue count, Open to S12 and Plan to S9, then General', async () => {
    renderDashboard(busyDashboard);
    const today = await widget('Today');
    const bar = within(today).getByRole('progressbar', { name: 'Reception tasks done' });
    expect(bar).toHaveAttribute('aria-valuetext', '12 of 20 done');
    expect(within(today).getByText('⚠ 1 overdue')).toBeInTheDocument();
    expect(
      within(today).getByText(/Ananya & Rohan · 6:30 PM – 11:00 PM · Leela Hall/),
    ).toBeVisible();
    expect(within(today).getByRole('link', { name: 'Open Reception on Today' })).toHaveAttribute(
      'href',
      '/today?scope=f-reception',
    );
    expect(within(today).getByRole('link', { name: 'Plan for Reception' })).toHaveAttribute(
      'href',
      `/events/${ANANYA}/by-function?fn=f-reception`,
    );
    expect(within(today).getByRole('link', { name: 'Open General on Today' })).toHaveAttribute(
      'href',
      `/today?scope=general-${ANANYA}`,
    );
  });

  it('Overdue and due this week: Issues first, then overdue, then the week, each opening S11', async () => {
    renderDashboard(busyDashboard);
    const tasks = await widget('Overdue and due this week · 13');
    const rows = within(tasks).getAllByRole('link');
    expect(rows[0]).toHaveTextContent('⚠ IssueGenerator backup');
    expect(rows[0]).toHaveTextContent('⚠ Backup not booked');
    expect(rows[1]).toHaveTextContent('⚠ Overdue4:30 PMStage decor complete');
    expect(rows[1]).toHaveTextContent('Ananya & Rohan · Reception');
    expect(rows[2]).toHaveTextContent('18 FebFood tasting');
    expect(rows[1]).toHaveAttribute('href', `/events/${ANANYA}/tasks?task=t-stage`);
    expect(within(tasks).getByRole('link', { name: '3 more · Upcoming' })).toHaveAttribute(
      'href',
      '/upcoming',
    );
  });

  it('a task row opens its event’s Tasks tab', async () => {
    const { router } = renderDashboard(busyDashboard);
    const tasks = await widget(/Overdue and due this week/);
    vi.useRealTimers(); // user-event waits on real timers
    await userEvent
      .setup()
      .click(within(tasks).getByRole('link', { name: /Stage decor complete/ }));
    expect(await screen.findByText('Tasks tab')).toBeInTheDocument();
    expect(router.state.location.search).toBe('?task=t-stage');
  });

  it('New client submissions: the not-planned count and when it was sent; opens S6', async () => {
    renderDashboard(busyDashboard);
    const submissions = await widget('New client submissions · 1');
    const row = within(submissions).getByRole('link', { name: /Meera & Karthik/ });
    expect(row).toHaveTextContent('Sent 2 days ago');
    expect(row).toHaveTextContent('12 not planned');
    expect(row).toHaveAttribute('href', `/events/${MEERA}`);
  });

  it('Upcoming events: dates, planned of budget, open tasks and ⚠ categories over; opens S6', async () => {
    renderDashboard(busyDashboard);
    const upcoming = await widget('Upcoming events · next 60 days · 2');
    const [meera, divya] = within(upcoming).getAllByRole('link');
    expect(meera).toHaveTextContent('5–7 Mar');
    expect(meera).toHaveTextContent('₹18.2L of ₹22L');
    expect(meera).toHaveTextContent('14 open tasks');
    expect(meera).toHaveAttribute('href', `/events/${MEERA}`);
    expect(divya).toHaveTextContent('₹9.5L planned · no budget');
    expect(divya).toHaveTextContent('1 open task');
    expect(divya).toHaveTextContent('⚠ Decor over');
  });

  it('Over budget: what is over and by how much, in words; opens S10', async () => {
    renderDashboard(busyDashboard);
    const over = await widget('Over budget · 1');
    const row = within(over).getByRole('link', { name: /Divya & Rahul/ });
    expect(row).toHaveTextContent('⚠ Decor ₹50,000 over');
    expect(row).toHaveAttribute('href', `/events/${DIVYA}/summary`);
  });

  it('keeps every widget in place with one calm line when there is nothing to show', async () => {
    renderDashboard(quietDashboard);
    expect(await screen.findByRole('heading', { level: 1, name: 'Good morning' })).toBeVisible();
    const today = await widget('Today');
    expect(today).toHaveTextContent(
      'No functions today. Next: Sangeet · Meera & Karthik · 5 Mar, 7:00 PM',
    );
    expect(within(today).getByRole('link', { name: 'Sangeet · Meera & Karthik' })).toHaveAttribute(
      'href',
      `/events/${MEERA}`,
    );
    expect(await widget('Overdue and due this week · 0')).toHaveTextContent(
      'Nothing overdue and nothing due this week.',
    );
    expect(await widget('New client submissions · 0')).toHaveTextContent('No new submissions.');
    expect(await widget('Upcoming events · next 60 days · 0')).toHaveTextContent(
      'No events in the next 60 days.',
    );
    expect(await widget('Over budget · 0')).toHaveTextContent(
      'Every event is within its budget and envelopes.',
    );
  });

  it('says when there is no function in the next 60 days either', async () => {
    renderDashboard(() => ({
      ...quietDashboard(),
      todayFunctions: { functions: [], general: [], next: null },
    }));
    expect(await widget('Today')).toHaveTextContent('No functions today or in the next 60 days.');
  });

  it('shows the error with Try again, which reloads', async () => {
    let fail = true;
    const { calls } = renderDashboard(() =>
      fail
        ? HttpResponse.json(
            { error: { code: 'INTERNAL', message: 'Boom', requestId: 'r' } },
            { status: 500 },
          )
        : busyDashboard(),
    );
    expect(await screen.findByRole('alert')).toHaveTextContent("⚠ Couldn't load the dashboard.");
    fail = false;
    vi.useRealTimers();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Good afternoon' })).toBeVisible();
    expect(calls.count).toBe(2);
  });
});

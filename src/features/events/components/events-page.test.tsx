import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { createEventsServer } from '../test/events-server';
import { renderEvents } from '../test/render';

vi.mock('@/features/auth/api/supabase', () => ({
  getAccessToken: () => Promise.resolve('test-token'),
}));

const server = setupServer();
beforeAll(() => {
  server.listen({ onUnhandledFrame: 'error' });
});
afterEach(() => {
  server.resetHandlers();
});
afterAll(() => {
  server.close();
});

function start(path = '/events') {
  const backend = createEventsServer();
  server.use(...backend.handlers);
  return renderEvents(path);
}

describe('S5 event list (decision 2026-11-25)', () => {
  it('lists upcoming events with their date range and function count', async () => {
    start();
    const priya = await screen.findByRole('link', { name: /Priya & Arjun wedding/ });
    expect(priya).toHaveTextContent('Priya · 12–14 Feb 2099 · 3 functions');
    expect(within(priya).getByText('Planning')).toBeInTheDocument();
    // Events with no functions yet stay under Upcoming.
    expect(screen.getByRole('link', { name: /Kavya & Rohan wedding/ })).toHaveTextContent(
      'Kavya · No functions yet',
    );
    expect(screen.queryByRole('link', { name: /Meera/ })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Upcoming' })).toHaveAttribute('aria-current', 'page');
  });

  it('moves to Past through the tab', async () => {
    const user = userEvent.setup();
    const { router } = start();
    await screen.findByRole('link', { name: /Priya/ });
    await user.click(screen.getByRole('link', { name: 'Past' }));
    expect(await screen.findByRole('link', { name: /Meera & Karthik wedding/ })).toHaveTextContent(
      'Meera · 10 Jan 2024 · 1 function',
    );
    expect(screen.queryByRole('link', { name: /Priya/ })).not.toBeInTheDocument();
    expect(router.state.location.search).toBe('?view=past');
  });
});

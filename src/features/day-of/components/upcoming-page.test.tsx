import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupServer } from 'msw/node';
import { toast } from 'sonner';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AgendaTask } from '../api/agenda.schema';
import { createDayOfServer } from '../test/day-of-server';
import { agendaFn, agendaTask, floral, OTHER_EVENT } from '../test/fixtures';
import { renderDayOf } from '../test/render';

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
  toast.dismiss();
  server.resetHandlers();
  vi.useRealTimers();
});
afterAll(() => {
  server.close();
});

const pre = (id: string, extra: Partial<AgendaTask>) =>
  agendaTask(id, { kind: 'pre_event', eventFunctionId: null, functionName: null, ...extra });

const SEED: AgendaTask[] = [
  pre('t-playlist', {
    title: 'Confirm playlist with couple',
    dueDate: '2099-02-15',
    dueTime: '11:00',
  }),
  pre('t-advance', {
    title: 'Pay DJ advance',
    dueDate: '2099-02-16',
    serviceName: 'Decor',
    vendor: floral,
  }),
  pre('t-return', { title: 'Return rented chairs', dueDate: '2099-02-20', kind: 'after_event' }),
  pre('t-missed', { title: 'Send final headcount', dueDate: '2099-02-12' }),
  agendaTask('t-stage', { title: 'Stage decor complete', dueTime: '16:30' }), // day-of: on Today
  pre('t-haldi', {
    title: 'Book turmeric supplier',
    dueDate: '2099-02-18',
    eventId: OTHER_EVENT,
    eventName: 'Priya & Karthik',
  }),
];

function start(
  tasks: AgendaTask[] = SEED,
  functions = [agendaFn('f-reception', 'Reception', '18:30')],
) {
  const backend = createDayOfServer({ tasks, functions });
  server.use(...backend.handlers);
  return { backend, ...renderDayOf('/upcoming') };
}

const region = (name: string) => screen.getByRole('region', { name });

describe('Upcoming (spec §14, decision 2026-11-26)', () => {
  it("groups the next 14 days' non-day-of tasks by date, across events, after the week's overdue", async () => {
    start();
    await screen.findByText('Confirm playlist with couple');
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([
      'Overdue',
      'Tomorrow',
      'Mon · 16 Feb',
      'Wed · 18 Feb',
      'Fri · 20 Feb',
    ]);
    expect(within(region('Overdue')).getByText('Send final headcount')).toBeInTheDocument();
    expect(within(region('Overdue')).getByText(/12 Feb · any time/)).toBeInTheDocument();
    expect(
      within(region('Wed · 18 Feb')).getByText(/Priya & Karthik · General/),
    ).toBeInTheDocument();
    expect(screen.queryByText('Stage decor complete')).not.toBeInTheDocument();
  });

  it('has the same actions: Call, Issue and Done with Undo', async () => {
    const user = userEvent.setup();
    const { backend } = start();
    await screen.findByText('Pay DJ advance');
    await user.click(screen.getByRole('button', { name: 'Call Floral Studio' }));
    expect(await screen.findByRole('dialog', { name: 'Call Floral Studio' })).toBeInTheDocument();
    await user.keyboard('{Escape}');

    await user.click(screen.getByRole('button', { name: 'Mark “Pay DJ advance” done' }));
    expect(await screen.findByText('Marked done')).toBeInTheDocument();
    await waitFor(() => {
      expect(backend.task('t-advance')?.status).toBe('done');
    });
    expect(
      await within(region('Mon · 16 Feb')).findByRole('button', {
        name: 'Mark “Pay DJ advance” not done',
      }),
    ).toBeInTheDocument();
  });

  it('quick add asks which event when the list spans several, then pre-fills today', async () => {
    const user = userEvent.setup();
    const { backend } = start();
    await screen.findByText('Pay DJ advance');
    await user.click(screen.getByRole('button', { name: 'Add task' }));
    const picker = await screen.findByRole('dialog', { name: 'Add a task to' });
    await user.click(within(picker).getByRole('button', { name: 'Priya & Karthik' }));
    const dialog = await screen.findByRole('dialog', { name: 'Add task' });
    expect(within(dialog).getByLabelText('Date')).toHaveValue('2099-02-14');
    await user.type(within(dialog).getByLabelText('Title'), 'Order haldi flowers');
    await user.click(within(dialog).getByRole('button', { name: 'Add task' }));
    await waitFor(() => {
      expect(backend.createBodies).toHaveLength(1);
    });
    expect(backend.createBodies[0]).toMatchObject({
      title: 'Order haldi flowers',
      dueDate: '2099-02-14',
    });
  });

  it('invites when nothing is due', async () => {
    start([], []);
    expect(
      await screen.findByRole('heading', { name: 'Nothing due in the next 14 days' }),
    ).toBeInTheDocument();
  });
});

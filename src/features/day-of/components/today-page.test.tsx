import { onlineManager } from '@tanstack/react-query';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupServer } from 'msw/node';
import { toast } from 'sonner';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AgendaFunction, AgendaTask } from '../api/agenda.schema';
import { createDayOfServer } from '../test/day-of-server';
import { agendaTask, beats, floral, muhurtham } from '../test/fixtures';
import { renderDayOf } from '../test/render';

vi.mock('@/features/auth/api/supabase', () => ({
  getAccessToken: () => Promise.resolve('test-token'),
}));

const server = setupServer();
beforeAll(() => {
  server.listen({ onUnhandledFrame: 'error' });
});
beforeEach(() => {
  // 16:45 IST on Ananya & Rohan's wedding day (Sat 14 Feb 2099). Only Date is faked, so timers
  // (the 400ms settle, toasts) run for real.
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2099-02-14T11:15:00Z'));
});
afterEach(() => {
  toast.dismiss();
  server.resetHandlers();
  vi.useRealTimers();
  onlineManager.setOnline(true);
  delete document.documentElement.dataset.contrast;
  localStorage.clear();
});
afterAll(() => {
  server.close();
});

const SEED: AgendaTask[] = [
  agendaTask('t-decor', {
    title: 'Stage decor complete',
    dueTime: '16:30',
    serviceName: 'Stage decor',
    vendor: floral,
  }),
  agendaTask('t-dj', {
    title: 'DJ sound check',
    dueTime: '17:30',
    serviceName: 'DJ',
    vendor: beats,
  }),
  agendaTask('t-counters', { title: 'Catering counters set', dueTime: '18:00' }),
  agendaTask('t-chairs', { title: 'Return extra chairs' }),
  agendaTask('t-photo', {
    title: 'Photo team arrived',
    dueTime: '16:30',
    status: 'done',
    completedAt: new Date('2099-02-14T11:00:00Z'),
  }),
  agendaTask('t-gen', {
    title: 'Generator backup',
    dueTime: '22:00',
    status: 'issue',
    issueNote: 'Second unit not delivered',
  }),
  agendaTask('t-priest', {
    title: 'Priest arrives',
    dueTime: '07:00',
    eventFunctionId: muhurtham.id,
    functionName: 'Muhurtham',
    status: 'done',
    completedAt: new Date('2099-02-14T01:00:00Z'),
  }),
  agendaTask('t-cash', {
    title: 'Collect cash from bank',
    eventFunctionId: null,
    functionName: null,
  }),
];

function start(path = '/today', tasks: AgendaTask[] = SEED, functions?: AgendaFunction[]) {
  const backend = createDayOfServer(functions ? { tasks, functions } : { tasks });
  server.use(...backend.handlers);
  return { backend, ...renderDayOf(path) };
}

/** Moves the device clock on, as the planner's next tap would be a few seconds later. */
const later = (seconds: number) => {
  vi.setSystemTime(new Date(Date.now() + seconds * 1000));
};
const toastAction = (text: string, action = 'Undo') => {
  const found = screen.getByText(text).closest('li');
  if (!found) throw new Error(`No toast "${text}"`);
  return within(found).getByRole('button', { name: action });
};

const headings = () => screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
const card = (title: string) => {
  const found = screen.getByText(title).closest('li');
  if (!found) throw new Error(`No card for ${title}`);
  return found;
};

describe('S12 Today (spec §14)', () => {
  it('opens on the next function with its header, progress and groups in order', async () => {
    start();
    expect(await screen.findByRole('heading', { level: 1, name: 'Reception' })).toBeInTheDocument();
    expect(screen.getByText('Sat 14 Feb · 6:30 PM · Leela Hall')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Tasks done' })).toHaveAttribute(
      'aria-valuetext',
      '1 of 6 done',
    );
    const chips = screen.getByRole('group', { name: "Today's functions" });
    expect(
      within(chips)
        .getAllByRole('button')
        .map((b) => b.textContent),
    ).toEqual(['Muhurtham', 'Reception', 'General']);
    expect(within(chips).getByRole('button', { name: 'Reception' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    // Issue pinned on top, then Overdue · Next up · Later · Anytime today; Done is collapsed.
    expect(headings()).toEqual(['Issue', 'Overdue', 'Next up', 'Later', 'Anytime today']);
    expect(screen.getByRole('button', { name: /Done · 1/ })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(within(card('Stage decor complete')).getByText('⚠ Overdue')).toBeInTheDocument();
    expect(
      within(card('Stage decor complete')).getByText('Stage decor · Floral Studio · due 4:30 PM'),
    ).toBeInTheDocument();
    expect(
      within(card('Generator backup')).getByText('Second unit not delivered'),
    ).toBeInTheDocument();
  });

  it('shows only tasks dated today, and switches function from the chips', async () => {
    const user = userEvent.setup();
    start('/today', [
      ...SEED,
      agendaTask('t-tomorrow', { title: 'Return the stage', dueDate: '2099-02-15' }),
    ]);
    await screen.findByRole('heading', { level: 1, name: 'Reception' });
    expect(screen.queryByText('Return the stage')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Muhurtham' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Muhurtham' })).toBeInTheDocument();
    expect(screen.getByText('Sat 14 Feb · 7:30 AM · Temple courtyard')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuetext', '1 of 1 done');
    await user.click(screen.getByRole('button', { name: 'General' }));
    expect(screen.getByText('Collect cash from bank')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Shift tasks' })).not.toBeInTheDocument();
  });

  it('Done (online): the change carries the device time and a key; Undo puts it back', async () => {
    const user = userEvent.setup();
    const { backend } = start();
    await screen.findByText('DJ sound check');
    await user.click(screen.getByRole('button', { name: 'Mark “DJ sound check” done' }));
    expect(await screen.findByText('Marked done')).toBeInTheDocument();
    await waitFor(() => {
      expect(backend.task('t-dj')?.status).toBe('done');
    });
    expect(await screen.findByRole('button', { name: /Done · 2/ })).toBeInTheDocument();
    expect(backend.statusRequests[0]).toMatchObject({
      taskId: 't-dj',
      body: { status: 'done', changedAt: '2099-02-14T11:15:00.000Z' },
      applied: true,
    });
    expect(backend.statusRequests[0]?.key).toMatch(/^[0-9a-f-]{36}$/);

    later(5);
    await user.click(toastAction('Marked done'));
    await waitFor(() => {
      expect(backend.task('t-dj')?.status).toBe('pending');
    });
    expect(backend.statusRequests[1]?.key).not.toBe(backend.statusRequests[0]?.key);
  });

  it('Done, Undo and Issue work offline and sync in order when back online', async () => {
    const user = userEvent.setup();
    const { backend } = start();
    await screen.findByText('DJ sound check');
    onlineManager.setOnline(false);

    await user.click(screen.getByRole('button', { name: 'Mark “DJ sound check” done' }));
    // Shown at once, and the planner is told it will sync.
    expect(await screen.findByRole('button', { name: /Done · 2/ })).toBeInTheDocument();
    expect(
      await screen.findByText(/Offline · changes will sync \(1 change waiting\)/),
    ).toBeInTheDocument();
    later(5);
    await screen.findByText('Marked done');
    await user.click(toastAction('Marked done'));
    expect(await screen.findByText(/2 changes waiting/)).toBeInTheDocument();

    later(30);
    await user.click(screen.getByRole('button', { name: 'Mark “Catering counters set” as issue' }));
    const dialog = await screen.findByRole('dialog', { name: 'Mark as issue' });
    await user.type(within(dialog).getByLabelText('What went wrong?'), 'Short of two counters');
    await user.click(within(dialog).getByRole('button', { name: 'Mark as issue' }));
    expect(await screen.findByText(/it syncs when you are back online/)).toBeInTheDocument();
    expect(within(card('Catering counters set')).getByText('⚠ Issue')).toBeInTheDocument();
    expect(backend.statusRequests).toHaveLength(0);

    onlineManager.setOnline(true);
    await waitFor(() => {
      expect(backend.statusRequests).toHaveLength(3);
    });
    expect(backend.statusRequests.map((r) => [r.taskId, r.body.status, r.applied])).toEqual([
      ['t-dj', 'done', true],
      ['t-dj', 'pending', true],
      ['t-counters', 'issue', true],
    ]);
    expect(new Set(backend.statusRequests.map((r) => r.key)).size).toBe(3);
    expect(backend.task('t-dj')?.status).toBe('pending');
    expect(backend.task('t-counters')).toMatchObject({
      status: 'issue',
      issueNote: 'Short of two counters',
    });
    await waitFor(() => {
      expect(screen.queryByText(/changes will sync|Syncing/)).not.toBeInTheDocument();
    });
  });

  it('an older offline change loses to a newer one already on the server (last write wins)', async () => {
    const user = userEvent.setup();
    const { backend } = start();
    await screen.findByText('DJ sound check');
    onlineManager.setOnline(false);
    await user.click(screen.getByRole('button', { name: 'Mark “DJ sound check” done' }));
    await screen.findByText(/1 change waiting/);
    // Meanwhile, at 16:50 on another phone, an Issue was saved.
    backend.setFromElsewhere('t-dj', {
      status: 'issue',
      issueNote: 'Speaker blown',
      changedAt: '2099-02-14T11:20:00.000Z',
    });

    onlineManager.setOnline(true);
    await waitFor(() => {
      expect(backend.statusRequests).toHaveLength(1);
    });
    expect(backend.statusRequests[0]?.applied).toBe(false);
    expect(
      await within(await screen.findByRole('region', { name: 'Issue' })).findByText(
        'DJ sound check',
      ),
    ).toBeInTheDocument();
  });

  it('an Issue needs a note and pins the task on top until it is Done', async () => {
    const user = userEvent.setup();
    const { backend } = start();
    await screen.findByText('DJ sound check');
    await user.click(screen.getByRole('button', { name: 'Mark “DJ sound check” as issue' }));
    const dialog = await screen.findByRole('dialog', { name: 'Mark as issue' });
    await user.click(within(dialog).getByRole('button', { name: 'Mark as issue' }));
    expect(await within(dialog).findByText('Say what went wrong')).toBeInTheDocument();
    await user.type(within(dialog).getByLabelText('What went wrong?'), 'Mic not working');
    await user.click(within(dialog).getByRole('button', { name: 'Mark as issue' }));
    await waitFor(() => {
      expect(backend.task('t-dj')).toMatchObject({ status: 'issue', issueNote: 'Mic not working' });
    });
    const issues = screen.getByRole('region', { name: 'Issue' });
    expect(within(issues).getByText('DJ sound check')).toBeInTheDocument();
    expect(within(issues).getByText('Mic not working')).toBeInTheDocument();
  });

  it('Call lists the vendor’s numbers and team; each dials on tap', async () => {
    const user = userEvent.setup();
    start();
    await screen.findByText('Stage decor complete');
    expect(
      within(card('Catering counters set')).queryByRole('button', { name: /Call/ }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Call Floral Studio' }));
    const sheet = await screen.findByRole('dialog', { name: 'Call Floral Studio' });
    const links = within(sheet).getAllByRole('link');
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      'tel:+919840012345',
      'tel:+919840012346',
      'tel:+919840055555',
    ]);
    expect(within(sheet).getByText('Meena')).toBeInTheDocument();
    expect(within(sheet).getByText('Lights')).toBeInTheDocument();
  });

  it("Shift tasks moves this function's pending timed tasks later, with Undo", async () => {
    const user = userEvent.setup();
    const { backend } = start();
    await screen.findByText('DJ sound check');
    await user.click(screen.getByRole('button', { name: 'Shift tasks' }));
    const sheet = await screen.findByRole('dialog', { name: 'Shift Reception tasks' });
    expect(within(sheet).getByText(/Moves 3 pending tasks with a time/)).toBeInTheDocument();
    await user.click(within(sheet).getByRole('radio', { name: '+15 min' }));
    await user.click(within(sheet).getByRole('button', { name: 'Shift 3 tasks' }));

    expect(await screen.findByText('3 tasks moved 15 min later')).toBeInTheDocument();
    expect(backend.shiftBodies[0]).toEqual({ eventFunctionId: 'f-reception', minutes: 15 });
    expect(backend.task('t-dj')?.dueTime).toBe('17:45');
    expect(backend.task('t-gen')?.dueTime).toBe('22:00'); // an Issue stays
    expect(backend.task('t-chairs')?.dueTime).toBeNull();

    await user.click(toastAction('3 tasks moved 15 min later'));
    await waitFor(() => {
      expect(backend.task('t-dj')?.dueTime).toBe('17:30');
    });
    expect(backend.shiftBodies[1]).toEqual({
      eventFunctionId: 'f-reception',
      minutes: -15,
      taskIds: ['t-decor', 't-dj', 't-counters'],
    });
  });

  it('warns before a shift past midnight and offers a custom number', async () => {
    const user = userEvent.setup();
    start('/today', [agendaTask('t-late', { title: 'Send-off', dueTime: '23:40' })]);
    await user.click(await screen.findByRole('button', { name: 'Shift tasks' }));
    const sheet = await screen.findByRole('dialog', { name: 'Shift Reception tasks' });
    expect(within(sheet).getByText(/Shift by at most 19 min/)).toBeInTheDocument();
    expect(within(sheet).getByRole('button', { name: 'Shift 1 task' })).toBeDisabled();
    await user.click(within(sheet).getByRole('radio', { name: 'Custom' }));
    await user.type(within(sheet).getByLabelText('Minutes later'), '10');
    expect(within(sheet).getByRole('button', { name: 'Shift 1 task' })).toBeEnabled();
  });

  it('opened from a reminder, it shows that task’s function', async () => {
    start('/today?task=t-priest');
    expect(await screen.findByRole('heading', { level: 1, name: 'Muhurtham' })).toBeInTheDocument();
  });

  it('the overdue strip names the first overdue task and opens it', async () => {
    const user = userEvent.setup();
    start('/today?scope=f-muhurtham');
    await screen.findByRole('heading', { level: 1, name: 'Muhurtham' });
    await user.click(screen.getByRole('button', { name: /Overdue: Stage decor complete/ }));
    expect(screen.getByRole('heading', { level: 1, name: 'Reception' })).toBeInTheDocument();
  });

  it('quick add opens the task form pre-filled with the current function', async () => {
    const user = userEvent.setup();
    const { backend } = start();
    await screen.findByText('DJ sound check');
    await user.click(screen.getByRole('button', { name: 'Add task' }));
    const dialog = await screen.findByRole('dialog', { name: 'Add task' });
    expect(
      await within(dialog).findByRole('button', { name: /Reception/, pressed: true }),
    ).toBeInTheDocument();
    await user.type(within(dialog).getByLabelText('Title'), 'Cake on stage');
    await user.type(within(dialog).getByLabelText('Time (optional)'), '21:00');
    await user.click(within(dialog).getByRole('button', { name: 'Add task' }));
    expect(await screen.findByText('Cake on stage')).toBeInTheDocument();
    expect(backend.createBodies[0]).toMatchObject({
      title: 'Cake on stage',
      eventFunctionIds: ['f-reception'],
      dueTime: '21:00',
    });
  });

  it('with nothing today, points to Upcoming', async () => {
    start('/today', [], []);
    expect(await screen.findByRole('heading', { name: 'Nothing on today' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'See upcoming tasks' })).toHaveAttribute(
      'href',
      '/upcoming',
    );
  });

  it('sunlight mode raises contrast and is remembered', async () => {
    const user = userEvent.setup();
    start();
    const toggle = await screen.findByRole('button', { name: 'Sunlight mode' });
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(document.documentElement.dataset.contrast).toBe('high');
    expect(localStorage.getItem('wp.sunlight')).toBe('on');
  });
});

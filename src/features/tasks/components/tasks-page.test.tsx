import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { createPlanServer, SEED_TASKS } from '@/features/plan/test/plan-server';
import { renderPlan } from '@/features/plan/test/render';
import type { Task } from '../api/tasks.schema';

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

// Seed (plan-server.ts): Mehendi and Sangeet on 12 Feb 2099, Reception on 14 Feb 2099.
// Tasks: "Confirm menu tasting" (1 Feb, Catering) and "Photographer arrives" (Reception, 5 PM).
function start(path = '/events/e1/tasks', tasks?: Task[]) {
  const backend = createPlanServer(tasks ? { tasks } : {});
  server.use(...backend.handlers);
  return { backend, ...renderPlan(path) };
}

type User = ReturnType<typeof userEvent.setup>;
const section = (name: RegExp) => screen.getByRole('region', { name });

async function choose(user: User, label: string, option: string) {
  await user.click(screen.getByRole('combobox', { name: label }));
  await user.click(await screen.findByRole('option', { name: option }));
}

async function openMenu(user: User, title: string, item: string) {
  await user.click(screen.getByRole('button', { name: `Actions for ${title}` }));
  await user.click(await screen.findByRole('menuitem', { name: item }));
}

describe('S11 tasks (spec §13)', () => {
  it('lists Pre-event by date and Day-of by function, with the service, vendor and a call link', async () => {
    start();
    await screen.findByText('Confirm menu tasting');
    const pre = section(/Pre-event/);
    expect(within(pre).getByText(/Catering · Annapoorna Caterers/)).toBeInTheDocument();
    expect(within(pre).getByText(/1 Feb 2099/)).toBeInTheDocument();

    const reception = section(/Day-of · Reception · 14 Feb 2099/);
    expect(within(reception).getByText('Photographer arrives')).toBeInTheDocument();
    expect(within(reception).getByText('5:00 PM')).toBeInTheDocument();
    expect(within(reception).getByRole('link', { name: 'Call Lens & Light' })).toHaveAttribute(
      'href',
      'tel:+919840022222',
    );
  });

  it('opened from the dashboard (?task=), scrolls to that task and marks it (decision 2026-11-26)', async () => {
    const scroll = vi.spyOn(Element.prototype, 'scrollIntoView');
    start('/events/e1/tasks?task=t-photo');
    const row = (await screen.findByText('Photographer arrives')).closest('li');
    expect(row).toHaveClass('animate-arrive');
    await waitFor(() => {
      expect(scroll.mock.contexts).toContain(row);
    });
    expect(screen.getByText('Confirm menu tasting').closest('li')).not.toHaveClass(
      'animate-arrive',
    );
    scroll.mockRestore();
  });

  it('adds a task on a typed date; a date after the last function goes to After the event', async () => {
    const user = userEvent.setup();
    const { backend } = start();
    await user.click(await screen.findByRole('button', { name: 'Add task' }));
    const dialog = await screen.findByRole('dialog', { name: 'Add task' });
    await user.type(within(dialog).getByLabelText('Title'), 'Settle vendor balance');
    await user.type(within(dialog).getByLabelText('Date'), '2099-02-20');
    await user.click(within(dialog).getByRole('button', { name: 'Add task' }));

    expect(await screen.findByText('Task added')).toBeInTheDocument();
    expect(
      within(section(/After the event/)).getByText('Settle vendor balance'),
    ).toBeInTheDocument();
    expect(backend.tasks.bodies.at(-1)).toEqual({
      title: 'Settle vendor balance',
      eventFunctionIds: [],
      dueDate: '2099-02-20',
      dueTime: null,
      serviceLineId: null,
      remindBeforeMin: 15,
    });
  });

  it('creates one task per function ticked, each on its function day', async () => {
    const user = userEvent.setup();
    const { backend } = start();
    await user.click(await screen.findByRole('button', { name: 'Add task' }));
    const dialog = await screen.findByRole('dialog', { name: 'Add task' });
    await user.type(within(dialog).getByLabelText('Title'), 'DJ team arrives');
    await user.click(within(dialog).getByRole('button', { name: /Sangeet/ }));
    await user.click(within(dialog).getByRole('button', { name: /Reception/ }));
    // Picking a function sets the date, so the date field goes away.
    expect(within(dialog).queryByLabelText('Date')).not.toBeInTheDocument();
    expect(within(dialog).getByText(/One task per function: 2 tasks/)).toBeInTheDocument();
    await user.type(within(dialog).getByLabelText('Time (optional)'), '16:00');
    await user.click(within(dialog).getByRole('button', { name: 'Add 2 tasks' }));

    expect(await screen.findByText('2 tasks added')).toBeInTheDocument();
    expect(within(section(/Day-of · Sangeet/)).getByText('DJ team arrives')).toBeInTheDocument();
    expect(within(section(/Day-of · Reception/)).getByText('DJ team arrives')).toBeInTheDocument();
    expect(backend.tasks.bodies.at(-1)).toMatchObject({
      eventFunctionIds: ['f-sangeet', 'f-reception'],
      dueDate: null,
      dueTime: '16:00',
    });
  });

  it('asks for a title and a function or date before saving', async () => {
    const user = userEvent.setup();
    const { backend } = start();
    await user.click(await screen.findByRole('button', { name: 'Add task' }));
    const dialog = await screen.findByRole('dialog', { name: 'Add task' });
    await user.click(within(dialog).getByRole('button', { name: 'Add task' }));
    expect(await within(dialog).findByText('Enter a title')).toBeInTheDocument();
    expect(within(dialog).getByText('Pick a function or enter a date')).toBeInTheDocument();
    expect(backend.tasks.bodies).toHaveLength(0);
  });

  it('marks done with Undo, and an issue only with a note', async () => {
    const user = userEvent.setup();
    start();
    await user.click(
      await screen.findByRole('button', { name: 'Mark “Photographer arrives” done' }),
    );
    expect(await screen.findByText('Done')).toBeInTheDocument();
    await user.click(await screen.findByRole('button', { name: 'Undo' }));
    expect(
      await screen.findByRole('button', { name: 'Mark “Photographer arrives” done' }),
    ).toBeInTheDocument();

    await openMenu(user, 'Confirm menu tasting', 'Mark as issue');
    const dialog = await screen.findByRole('dialog', { name: 'Mark as issue' });
    await user.click(within(dialog).getByRole('button', { name: 'Mark as issue' }));
    expect(within(dialog).getByText('Say what went wrong')).toBeInTheDocument();
    await user.type(within(dialog).getByLabelText('What went wrong?'), 'Chef unavailable that day');
    await user.click(within(dialog).getByRole('button', { name: 'Mark as issue' }));
    expect(await screen.findByText('⚠ Issue')).toBeInTheDocument();
    expect(screen.getByText('⚠ Chef unavailable that day')).toBeInTheDocument();
  });

  it('edits a task: picking a function moves it to that day', async () => {
    const user = userEvent.setup();
    const { backend } = start();
    await screen.findByText('Confirm menu tasting');
    await openMenu(user, 'Confirm menu tasting', 'Edit');
    const dialog = await screen.findByRole('dialog', { name: 'Edit task' });
    expect(within(dialog).getByLabelText('Title')).toHaveValue('Confirm menu tasting');
    await user.click(within(dialog).getByRole('button', { name: /Mehendi/ }));
    await user.click(within(dialog).getByRole('button', { name: 'Save task' }));

    expect(await screen.findByText('Task saved')).toBeInTheDocument();
    expect(
      within(section(/Day-of · Mehendi/)).getByText('Confirm menu tasting'),
    ).toBeInTheDocument();
    expect(backend.tasks.bodies.at(-1)).toMatchObject({
      eventFunctionId: 'f-mehendi',
      dueDate: null,
      serviceLineId: 'l-catering',
    });
  });

  it('deletes a task after confirming', async () => {
    const user = userEvent.setup();
    start();
    await screen.findByText('Confirm menu tasting');
    await openMenu(user, 'Confirm menu tasting', 'Delete');
    const confirm = await screen.findByRole('alertdialog', { name: 'Delete this task?' });
    await user.click(within(confirm).getByRole('button', { name: 'Delete task' }));
    await waitFor(() => {
      expect(screen.queryByText('Confirm menu tasting')).not.toBeInTheDocument();
    });
  });

  it('filters by function and status, keeping the filters in the URL', async () => {
    const user = userEvent.setup();
    const { router } = start();
    await screen.findByText('Confirm menu tasting');
    await choose(user, 'Function', 'Reception');
    expect(screen.queryByText('Confirm menu tasting')).not.toBeInTheDocument();
    expect(screen.getByText('Photographer arrives')).toBeInTheDocument();
    expect(router.state.location.search).toBe('?fn=f-reception');

    await choose(user, 'Status', 'Done');
    expect(screen.getByText('No tasks match these filters.')).toBeInTheDocument();
    // The filter bar's Clear filters, beside the empty-state one.
    const [clear] = screen.getAllByRole('button', { name: 'Clear filters' });
    if (!clear) throw new Error('No Clear filters button');
    await user.click(clear);
    expect(screen.getByText('Confirm menu tasting')).toBeInTheDocument();
    expect(router.state.location.search).toBe('');
  });

  it('opens with the filters in the link', async () => {
    start('/events/e1/tasks?vendor=v-anna');
    expect(await screen.findByText('Confirm menu tasting')).toBeInTheDocument();
    expect(screen.queryByText('Photographer arrives')).not.toBeInTheDocument();
  });

  it('flags a pending task past its date as overdue', async () => {
    start('/events/e1/tasks', [
      { ...SEED_TASKS[0], id: 't-late', title: 'Pay advance', dueDate: '2020-01-01' } as Task,
    ]);
    expect(await screen.findByText('⚠ Overdue')).toBeInTheDocument();
  });

  it('invites the first task on an event with none', async () => {
    start('/events/e1/tasks', []);
    expect(await screen.findByRole('heading', { name: 'Add your first task' })).toBeInTheDocument();
  });
});

describe('tasks elsewhere in the workspace', () => {
  it('S6 counts open tasks and links to the Tasks tab', async () => {
    start('/events/e1');
    const tabs = await screen.findByRole('navigation', { name: 'Event sections' });
    expect(within(tabs).getByRole('link', { name: 'Tasks' })).toHaveAttribute(
      'href',
      '/events/e1/tasks',
    );
    const card = (await screen.findByText('Open tasks', { selector: 'dt' })).parentElement;
    if (!card) throw new Error('No Open tasks card');
    expect(card).toHaveTextContent('2');
    expect(within(card).getByRole('link', { name: 'View tasks' })).toHaveAttribute(
      'href',
      '/events/e1/tasks',
    );
  });

  it("S9 lists the function's tasks and adds one for it", async () => {
    const user = userEvent.setup();
    start('/events/e1/by-function?fn=f-reception');
    const panel = await screen.findByRole('region', { name: 'Tasks' });
    expect(await within(panel).findByText('Photographer arrives')).toBeInTheDocument();
    await user.click(within(panel).getByRole('button', { name: 'Add task' }));
    const dialog = await screen.findByRole('dialog', { name: 'Add task' });
    expect(
      within(dialog).getByRole('button', { name: /Reception/, pressed: true }),
    ).toBeInTheDocument();
  });

  it("S8 adds a task pre-filled with the line's service and functions", async () => {
    const user = userEvent.setup();
    start('/events/e1/plan');
    await user.click(await screen.findByRole('button', { name: 'Catering' }));
    const drawer = await screen.findByRole('dialog', { name: 'Edit Catering' });
    await user.click(within(drawer).getByRole('button', { name: 'Add task' }));
    const dialog = await screen.findByRole('dialog', { name: 'Add task' });
    expect(within(dialog).getByRole('combobox', { name: 'Service (optional)' })).toHaveTextContent(
      'Catering · Annapoorna Caterers',
    );
    expect(
      within(dialog).getByRole('button', { name: /Mehendi/, pressed: true }),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole('button', { name: /Reception/, pressed: true }),
    ).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Add 2 tasks' })).toBeInTheDocument();
  });

  it('S7 warns that removing a line leaves its tasks without a vendor', async () => {
    const user = userEvent.setup();
    start('/events/e1/plan');
    await user.click(await screen.findByRole('button', { name: 'Actions for Candid Photography' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Remove from plan' }));
    const confirm = await screen.findByRole('alertdialog');
    expect(
      await within(confirm).findByText('⚠ 1 task stays on its date but loses its vendor.'),
    ).toBeInTheDocument();
  });
});

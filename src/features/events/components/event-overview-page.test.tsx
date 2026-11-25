import { fireEvent, screen, waitFor, within } from '@testing-library/react';
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

function start(eventId = 'e-priya') {
  const backend = createEventsServer();
  server.use(...backend.handlers);
  renderEvents(`/events/${eventId}`);
  return backend;
}

const functionNames = () =>
  within(screen.getByRole('table'))
    .getAllByRole('row')
    .slice(1)
    .map((row) => within(row).getAllByRole('cell')[1]?.querySelector('span')?.textContent);

async function openMenu(user: ReturnType<typeof userEvent.setup>, name: string) {
  await user.click(screen.getByRole('button', { name: `Actions for ${name}` }));
}

describe('S6 functions (spec §10)', () => {
  it('shows every function with date, 12-hour times (past midnight marked) and guests', async () => {
    start();
    await screen.findByRole('table');
    expect(functionNames()).toEqual(['Mehendi', 'Sangeet', 'Muhurtham / Wedding']);
    const sangeet = screen.getAllByRole('row')[2];
    if (!sangeet) throw new Error('row missing');
    expect(sangeet).toHaveTextContent('6:30 PM – 1:00 AM +1');
    expect(sangeet).toHaveTextContent('400 pax');
    expect(screen.getAllByRole('row')[3]).toHaveTextContent('1,200 pax');
  });

  it('adds a function, and the first function moves the event to Planning', async () => {
    const user = userEvent.setup();
    const backend = start('e-kavya');
    expect(await screen.findByText('Add your first function')).toBeInTheDocument();
    expect(screen.getByText('Created')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Add function' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('combobox', { name: 'Function' }));
    await user.click(await screen.findByRole('option', { name: 'Sangeet' }));
    // An archived function type can't be newly chosen.
    expect(screen.queryByRole('option', { name: /Haldi/ })).not.toBeInTheDocument();
    fireEvent.change(within(dialog).getByLabelText('Date'), { target: { value: '2099-03-01' } });
    fireEvent.change(within(dialog).getByLabelText('Start'), { target: { value: '18:30' } });
    fireEvent.change(within(dialog).getByLabelText('End (optional)'), {
      target: { value: '00:30' },
    });
    expect(within(dialog).getByText('Ends after midnight, the next day.')).toBeInTheDocument();
    await user.type(within(dialog).getByLabelText('Venue name (optional)'), 'Leela Palace');
    await user.type(within(dialog).getByLabelText('Guests'), '400');
    await user.click(within(dialog).getByRole('button', { name: 'Add function' }));

    expect(await screen.findByText('Sangeet added')).toBeInTheDocument();
    expect(backend.calls.at(-1)).toEqual({
      method: 'POST',
      path: '/events/e-kavya/functions',
      body: {
        functionTypeId: 't-sangeet',
        customName: null,
        date: '2099-03-01',
        startTime: '18:30',
        endTime: '00:30',
        venueName: 'Leela Palace',
        venueAddress: '',
        guestCount: 400,
      },
    });
    await waitFor(() => {
      expect(screen.getByText('Planning')).toBeInTheDocument();
    });
    expect(functionNames()).toEqual(['Sangeet']);
  });

  it('asks for a name when the function is Other, and for the required fields', async () => {
    const user = userEvent.setup();
    start('e-kavya');
    await user.click(await screen.findByRole('button', { name: 'Add function' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Add function' }));
    expect(within(dialog).getByText('Choose a function type, or Other')).toBeInTheDocument();
    expect(within(dialog).getByText('Choose a date')).toBeInTheDocument();
    expect(
      within(dialog).getByText('Enter the number of guests (an estimate is fine)'),
    ).toBeInTheDocument();

    await user.click(within(dialog).getByRole('combobox', { name: 'Function' }));
    await user.click(await screen.findByRole('option', { name: 'Other…' }));
    await user.click(within(dialog).getByRole('button', { name: 'Add function' }));
    expect(within(dialog).getByText('Name the function')).toBeInTheDocument();
  });

  it('edits a function and confirms the save', async () => {
    const user = userEvent.setup();
    const backend = start();
    await screen.findByRole('table');
    await openMenu(user, 'Sangeet');
    await user.click(await screen.findByRole('menuitem', { name: 'Edit' }));
    const dialog = await screen.findByRole('dialog', { name: 'Edit Sangeet' });
    const guests = within(dialog).getByLabelText('Guests');
    expect(guests).toHaveValue('400');
    await user.clear(guests);
    await user.type(guests, '450');
    await user.click(within(dialog).getByRole('button', { name: 'Save function' }));
    expect(await screen.findByText('Saved')).toBeInTheDocument();
    expect(backend.calls.at(-1)).toMatchObject({
      method: 'PATCH',
      path: '/events/e-priya/functions/f-sangeet',
      body: { guestCount: 450, functionTypeId: 't-sangeet', customName: null, endTime: '01:00' },
    });
  });

  it('warns before deleting a function, then removes it', async () => {
    const user = userEvent.setup();
    start();
    await screen.findByRole('table');
    await openMenu(user, 'Mehendi');
    await user.click(await screen.findByRole('menuitem', { name: 'Delete' }));
    const alert = await screen.findByRole('alertdialog', { name: 'Delete Mehendi?' });
    expect(await within(alert).findByText('Nothing is planned for it yet.')).toBeInTheDocument();
    await user.click(within(alert).getByRole('button', { name: 'Delete function' }));
    expect(await screen.findByText('Deleted Mehendi')).toBeInTheDocument();
    await waitFor(() => {
      expect(functionNames()).toEqual(['Sangeet', 'Muhurtham / Wedding']);
    });
  });

  it('reorders with Move down (the single-pointer alternative to dragging)', async () => {
    const user = userEvent.setup();
    const backend = start();
    await screen.findByRole('table');
    await openMenu(user, 'Mehendi');
    await user.click(await screen.findByRole('menuitem', { name: 'Move down' }));
    await waitFor(() => {
      expect(functionNames()).toEqual(['Sangeet', 'Mehendi', 'Muhurtham / Wedding']);
    });
    expect(backend.calls.at(-1)).toEqual({
      method: 'PUT',
      path: '/events/e-priya/functions/order',
      body: { ids: ['f-sangeet', 'f-mehendi', 'f-muhurtham'] },
    });
  });
});

describe('S6 client details and status', () => {
  it('edits the overall budget, typed with Indian grouping', async () => {
    const user = userEvent.setup();
    const backend = start();
    await screen.findByRole('table');
    expect(screen.getByRole('banner')).toHaveTextContent('Budget not set');
    await user.click(screen.getByRole('button', { name: 'Edit details' }));
    const dialog = await screen.findByRole('dialog', { name: 'Edit details' });
    await user.type(within(dialog).getByLabelText('Overall budget (₹, optional)'), '25,00,000');
    await user.click(within(dialog).getByRole('button', { name: 'Save details' }));
    await waitFor(() => {
      expect(screen.getByRole('banner')).toHaveTextContent('Budget ₹25,00,000');
    });
    expect(backend.calls.at(-1)).toMatchObject({
      method: 'PATCH',
      path: '/events/e-priya',
      body: { overallBudget: 2_500_000, clientEmail: '' },
    });
  });

  it('rejects a budget that is not whole rupees', async () => {
    const user = userEvent.setup();
    start();
    await screen.findByRole('table');
    await user.click(screen.getByRole('button', { name: 'Edit details' }));
    const dialog = await screen.findByRole('dialog', { name: 'Edit details' });
    await user.type(within(dialog).getByLabelText('Overall budget (₹, optional)'), '25.5L');
    await user.click(within(dialog).getByRole('button', { name: 'Save details' }));
    expect(within(dialog).getByText('Use whole rupees, like 25,00,000')).toBeInTheDocument();
  });

  it('marks the event completed, then reopens it to Planning', async () => {
    const user = userEvent.setup();
    start();
    await screen.findByRole('table');
    await openMenu(user, 'Priya & Arjun wedding');
    await user.click(await screen.findByRole('menuitem', { name: 'Mark completed' }));
    expect(await screen.findByText('Marked completed')).toBeInTheDocument();
    expect(within(screen.getByRole('banner')).getByText('Completed')).toBeInTheDocument();

    await openMenu(user, 'Priya & Arjun wedding');
    expect(screen.queryByRole('menuitem', { name: 'Cancel event' })).not.toBeInTheDocument();
    await user.click(await screen.findByRole('menuitem', { name: /Reopen event/ }));
    expect(await screen.findByText('Event reopened')).toBeInTheDocument();
    expect(within(screen.getByRole('banner')).getByText('Planning')).toBeInTheDocument();
  });

  it('confirms before cancelling', async () => {
    const user = userEvent.setup();
    const backend = start();
    await screen.findByRole('table');
    await openMenu(user, 'Priya & Arjun wedding');
    await user.click(await screen.findByRole('menuitem', { name: 'Cancel event' }));
    const alert = await screen.findByRole('alertdialog', { name: 'Cancel Priya & Arjun wedding?' });
    await user.click(within(alert).getByRole('button', { name: 'Cancel event' }));
    expect(await screen.findByText('Event cancelled')).toBeInTheDocument();
    expect(within(screen.getByRole('banner')).getByText('Cancelled')).toBeInTheDocument();
    expect(backend.calls.at(-1)).toEqual({
      method: 'PATCH',
      path: '/events/e-priya/status',
      body: { status: 'cancelled' },
    });
  });

  it("shows a not-found page for an event that isn't the company's", async () => {
    start('e-missing');
    expect(
      await screen.findByRole('heading', { name: "This event doesn't exist" }),
    ).toBeInTheDocument();
  });
});

import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { createPlanServer } from '../test/plan-server';
import { renderPlan } from '../test/render';

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

function start(path?: string, options: { noFunctions?: boolean } = {}) {
  const backend = createPlanServer(options);
  server.use(...backend.handlers);
  const view = renderPlan(path);
  return { backend, ...view };
}

const band = (name: string) => screen.getByRole('region', { name });
type User = ReturnType<typeof userEvent.setup>;

async function choose(user: User, label: string, option: string | RegExp) {
  await user.click(screen.getByRole('combobox', { name: label }));
  await user.click(await screen.findByRole('option', { name: option }));
}

describe('S7 plan by category (spec §11)', () => {
  it('shows category bands, envelopes, Shared lines and the planned total', async () => {
    start();
    const food = await screen.findByRole('region', { name: 'Food and Beverage' });
    expect(within(food).getByText('⚠ ₹75,000 over')).toBeInTheDocument();
    expect(within(food).getByRole('button', { name: 'Catering' })).toBeInTheDocument();
    // Band planned and the line total.
    expect(within(food).getAllByText('₹5,75,000')).toHaveLength(2);

    const photo = band('Photography and Videography');
    expect(within(photo).getByText('Shared')).toBeInTheDocument();
    expect(within(photo).getByText('No envelope', { exact: false })).toBeInTheDocument();
    // Empty categories invite an add.
    expect(within(band('Entertainment')).getByText('No services yet')).toBeInTheDocument();
    // Planned of overall budget: 5,75,000 + 1,80,000.
    expect(screen.getByText('₹7,55,000')).toBeInTheDocument();
    expect(screen.getByLabelText('Functions and guests')).toHaveTextContent(
      'Mehendi 150 · Sangeet 400 · Reception 1,200',
    );
  });

  it('expands a line to its rows with guests, edited and changed tags', async () => {
    const user = userEvent.setup();
    start();
    await user.click(await screen.findByRole('button', { name: 'Show functions for Catering' }));
    const rows = within(band('Food and Beverage')).getAllByRole('row');
    expect(rows[1]).toHaveTextContent('Mehendi');
    expect(rows[1]).toHaveTextContent('150 pax(guests)');
    const reception = rows[2];
    if (!reception) throw new Error('Reception row missing');
    expect(reception).toHaveTextContent('Saravana Caterers');
    expect(within(reception).getByText('changed')).toBeInTheDocument();
    expect(within(reception).getByText('edited')).toBeInTheDocument();
  });

  it('asks for functions first on an event without any', async () => {
    start(undefined, { noFunctions: true });
    expect(await screen.findByRole('heading', { name: 'Add functions first' })).toBeInTheDocument();
  });
});

describe('S8 add or edit service', () => {
  it('adds a service across functions with a vendor, Same for all and row budgets', async () => {
    const user = userEvent.setup();
    const { backend } = start();
    await screen.findByRole('region', { name: 'Entertainment' });
    await user.click(screen.getByRole('button', { name: 'Add service' }));
    const drawer = await screen.findByRole('dialog', { name: 'Add service' });

    await choose(user, 'Category', 'Entertainment');
    await choose(user, 'Service', 'DJ / VDJ');
    expect(within(drawer).getByText('Measured in Hours')).toBeInTheDocument();
    // Only vendors offering the service, with their rate.
    await choose(user, 'Vendor', 'Beat Republic · ₹8,000 per hour');

    await user.click(within(drawer).getByRole('button', { name: /Sangeet/ }));
    await user.click(within(drawer).getByRole('button', { name: /Reception/ }));
    await user.type(within(drawer).getByLabelText('Hours for Reception'), '4');
    await user.type(within(drawer).getByLabelText('Hours for Same for all'), '5');
    await user.click(within(drawer).getByRole('button', { name: 'Fill' }));
    // Fill copies into empty cells only.
    expect(within(drawer).getByLabelText('Hours for Sangeet')).toHaveValue('5');
    expect(within(drawer).getByLabelText('Hours for Reception')).toHaveValue('4');

    // Rate suggestion: 9 hrs × ₹8,000, shown but never filled by itself.
    expect(within(drawer).getByText('₹72,000')).toBeInTheDocument();
    expect(within(drawer).getByLabelText('Line budget (₹)')).toHaveValue('');

    await user.type(within(drawer).getByLabelText('Budget for Sangeet (₹)'), '40,000');
    await user.type(within(drawer).getByLabelText('Budget for Reception (₹)'), '35,000');
    // Row budgets switch the line budget off; the total updates live.
    expect(within(drawer).getByLabelText('Line budget (₹)')).toBeDisabled();
    expect(within(drawer).getByText('₹75,000')).toBeInTheDocument();

    await user.click(within(drawer).getByRole('button', { name: 'Save service' }));
    expect(await screen.findByText('DJ / VDJ added to the plan')).toBeInTheDocument();
    expect(backend.calls.at(-1)).toEqual({
      method: 'POST',
      path: '/events/e1/service-lines',
      body: {
        serviceId: 's-dj',
        defaultVendorId: 'v-beat',
        perFunctionVendor: false,
        lineBudget: null,
        notes: '',
        rows: [
          {
            eventFunctionId: 'f-sangeet',
            vendorId: null,
            quantities: { hours: 5 },
            budget: 40_000,
          },
          {
            eventFunctionId: 'f-reception',
            vendorId: null,
            quantities: { hours: 4 },
            budget: 35_000,
          },
        ],
      },
    });
    await waitFor(() => {
      expect(
        within(band('Entertainment')).getByRole('button', { name: 'DJ / VDJ' }),
      ).toBeInTheDocument();
    });
  });

  it('uses the rate suggestion only when asked', async () => {
    const user = userEvent.setup();
    start();
    await screen.findByRole('region', { name: 'Entertainment' });
    await user.click(screen.getByRole('button', { name: 'Add service' }));
    const drawer = await screen.findByRole('dialog', { name: 'Add service' });
    await choose(user, 'Category', 'Entertainment');
    await choose(user, 'Service', 'DJ / VDJ');
    await choose(user, 'Vendor', /Beat Republic/);
    await user.click(within(drawer).getByRole('button', { name: /Sangeet/ }));
    await user.type(within(drawer).getByLabelText('Hours for Sangeet'), '4.5');
    expect(within(drawer).getByText('₹36,000')).toBeInTheDocument();
    await user.click(within(drawer).getByRole('button', { name: 'Use' }));
    expect(within(drawer).getByLabelText('Line budget (₹)')).toHaveValue('36,000');
    // A line budget switches row budgets off.
    expect(within(drawer).getByLabelText('Budget for Sangeet (₹)')).toBeDisabled();
  });

  it('pre-fills pax from guests and refuses quarter hours', async () => {
    const user = userEvent.setup();
    start();
    await screen.findByRole('region', { name: 'Entertainment' });
    await user.click(
      within(band('Entertainment')).getByRole('button', { name: 'Add service to Entertainment' }),
    );
    const drawer = await screen.findByRole('dialog', { name: 'Add service' });
    await choose(user, 'Service', 'Singers / Performers');
    await user.click(within(drawer).getByRole('button', { name: /Mehendi/ }));
    await user.type(within(drawer).getByLabelText('Hours for Mehendi'), '2.25');
    await user.click(within(drawer).getByRole('button', { name: 'Save service' }));
    expect(await within(drawer).findByText('⚠ Half-hour steps, like 4.5')).toBeInTheDocument();
  });

  it('opens the existing line instead of planning a service twice', async () => {
    const user = userEvent.setup();
    start();
    await screen.findByRole('region', { name: 'Food and Beverage' });
    await user.click(screen.getByRole('button', { name: 'Add service' }));
    const drawer = await screen.findByRole('dialog', { name: 'Add service' });
    await choose(user, 'Category', 'Food and Beverage');
    await choose(user, 'Service', 'Catering (planned)');
    expect(within(drawer).getByRole('button', { name: 'Save service' })).toBeDisabled();
    await user.click(within(drawer).getByRole('button', { name: 'Open it' }));
    expect(await screen.findByRole('dialog', { name: 'Edit Catering' })).toBeInTheDocument();
  });

  it('warns before unticking a function with a budget, then saves without it', async () => {
    const user = userEvent.setup();
    const { backend } = start();
    await user.click(await screen.findByRole('button', { name: 'Catering' }));
    const drawer = await screen.findByRole('dialog', { name: 'Edit Catering' });
    expect(within(drawer).getByLabelText('Pax for Mehendi')).toHaveValue('150');
    expect(within(drawer).getByText('(guests)')).toBeInTheDocument();

    await user.click(within(drawer).getByRole('button', { name: /Mehendi/ }));
    expect(
      within(drawer).getByText("⚠ Mehendi's ₹75,000 will be removed when you save."),
    ).toBeInTheDocument();
    await user.click(within(drawer).getByRole('button', { name: 'Save service' }));
    expect(await screen.findByText('Catering saved')).toBeInTheDocument();
    expect(backend.calls.at(-1)).toMatchObject({
      method: 'PUT',
      path: '/events/e1/service-lines/l-catering',
      body: {
        perFunctionVendor: true,
        rows: [
          {
            eventFunctionId: 'f-reception',
            vendorId: 'v-saravana',
            quantities: { pax: 1000 },
            budget: 5_00_000,
          },
        ],
      },
    });
  });

  it('adds a new vendor inline, already offering the service', async () => {
    const user = userEvent.setup();
    const { backend } = start('/events/e1/plan?add=s-dj');
    const drawer = await screen.findByRole('dialog', { name: 'Add service' });
    // Opened from S6 "Add to plan" with the service chosen.
    expect(within(drawer).getByRole('combobox', { name: 'Service' })).toHaveTextContent('DJ / VDJ');
    await user.click(within(drawer).getByRole('button', { name: 'New vendor' }));
    const dialog = await screen.findByRole('dialog', { name: 'New vendor' });
    await user.type(within(dialog).getByLabelText('Vendor name'), 'Rhythm House');
    await user.type(within(dialog).getByLabelText('Phone'), '+91 98400 55555');
    await user.click(within(dialog).getByRole('button', { name: 'Save vendor' }));
    await waitFor(() => {
      expect(within(drawer).getByRole('combobox', { name: 'Vendor' })).toHaveTextContent(
        'Rhythm House',
      );
    });
    expect(backend.calls.at(-1)).toMatchObject({
      method: 'POST',
      path: '/vendors',
      body: { name: 'Rhythm House', services: [{ serviceId: 's-dj' }] },
    });
  });
});

describe('S7 envelopes and removal', () => {
  it('sets an envelope from the category header', async () => {
    const user = userEvent.setup();
    const { backend } = start();
    await screen.findByRole('region', { name: 'Photography and Videography' });
    await user.click(
      screen.getByRole('button', { name: 'Actions for Photography and Videography' }),
    );
    await user.click(await screen.findByRole('menuitem', { name: 'Set envelope' }));
    const dialog = await screen.findByRole('dialog', {
      name: 'Envelope for Photography and Videography',
    });
    await user.type(within(dialog).getByLabelText('Envelope (₹)'), '3,00,000');
    await user.click(within(dialog).getByRole('button', { name: 'Save envelope' }));
    expect(await screen.findByText('Envelope saved')).toBeInTheDocument();
    expect(backend.calls.at(-1)).toEqual({
      method: 'PUT',
      path: '/events/e1/envelopes/c-photo',
      body: { amount: 3_00_000 },
    });
    await waitFor(() => {
      expect(
        within(band('Photography and Videography')).getByText('₹1,20,000 left'),
      ).toBeInTheDocument();
    });
  });

  it('removes a line after confirming', async () => {
    const user = userEvent.setup();
    const { backend } = start();
    await screen.findByRole('region', { name: 'Photography and Videography' });
    await user.click(screen.getByRole('button', { name: 'Actions for Candid Photography' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Remove from plan' }));
    const alert = await screen.findByRole('alertdialog', {
      name: 'Remove Candid Photography from the plan?',
    });
    await user.click(within(alert).getByRole('button', { name: 'Remove from plan' }));
    expect(await screen.findByText('Removed Candid Photography')).toBeInTheDocument();
    expect(backend.calls.at(-1)).toEqual({
      method: 'DELETE',
      path: '/events/e1/service-lines/l-candid',
      body: undefined,
    });
  });
});

describe('S6 with a plan', () => {
  it('shows Planned and Add to plan for requested services, and the plan tab', async () => {
    const user = userEvent.setup();
    const { router } = start('/events/e1');
    const requested = await screen.findByRole('region', { name: /Requested by client/ });
    expect(within(requested).getByText('✓ Planned')).toBeInTheDocument();
    await user.click(within(requested).getByRole('link', { name: 'Add DJ / VDJ to plan' }));
    expect(await screen.findByRole('dialog', { name: 'Add service' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/events/e1/plan');
    expect(screen.getByRole('link', { name: 'Plan by category', hidden: true })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });
});

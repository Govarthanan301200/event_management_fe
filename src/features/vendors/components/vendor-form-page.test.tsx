import { screen, within } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { renderVendors } from '../test/render';
import { createVendorsServer } from '../test/vendors-server';

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

function start(path: string) {
  const backend = createVendorsServer();
  server.use(...backend.handlers);
  const { router } = renderVendors(path);
  return { backend, router };
}

async function chooseServices(user: UserEvent, names: string[]) {
  await user.click(screen.getByRole('button', { name: /choose services|change services/i }));
  const dialog = await screen.findByRole('dialog', { name: 'Services offered' });
  for (const name of names) await user.click(within(dialog).getByRole('checkbox', { name }));
  await user.click(within(dialog).getByRole('button', { name: 'Save selection' }));
}

async function choosePer(user: UserEvent, service: string, option: string) {
  await user.click(screen.getByRole('combobox', { name: `Per for ${service}` }));
  await user.click(await screen.findByRole('option', { name: option }));
}

const posted = (
  calls: { method: string; path: string; body: unknown }[],
  method: string,
  path: string,
) => calls.find((call) => call.method === method && call.path === path)?.body;

describe('S4 add vendor', () => {
  it('requires a name, a phone and at least one service (spec §9)', async () => {
    const user = userEvent.setup();
    const { backend } = start('/vendors/new');
    await user.click(await screen.findByRole('button', { name: 'Save vendor' }));

    expect(await screen.findByText('Enter the vendor name')).toBeInTheDocument();
    expect(screen.getByText('Enter a phone number')).toBeInTheDocument();
    expect(screen.getByText(/choose at least one service this vendor offers/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Vendor name')).toHaveAttribute('aria-invalid', 'true');
    expect(posted(backend.calls, 'POST', '/vendors')).toBeUndefined();
  });

  it('saves services from several categories, one with a rate and one without', async () => {
    const user = userEvent.setup();
    const { backend, router } = start('/vendors/new');
    await user.type(await screen.findByLabelText('Vendor name'), 'Nritya Studio');
    await user.type(screen.getByLabelText('Phone'), '+91 99400 11111');
    await user.type(screen.getByLabelText('City'), 'Coimbatore');
    await chooseServices(user, ['DJ / VDJ', 'Candid Photography']);

    // Grouped by category, in catalogue order.
    expect(screen.getByRole('heading', { name: 'Entertainment' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Photography and Videography' }),
    ).toBeInTheDocument();
    await user.type(screen.getByLabelText('Rate (₹) for DJ / VDJ'), '8,000');
    await choosePer(user, 'DJ / VDJ', 'per hour');
    await user.type(screen.getByLabelText('Note for DJ / VDJ'), 'Min 3 hrs');
    await user.click(screen.getByRole('button', { name: 'Save vendor' }));

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Nritya Studio' }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toMatch(/^\/vendors\/v-new-/);
    expect(posted(backend.calls, 'POST', '/vendors')).toMatchObject({
      name: 'Nritya Studio',
      phone: '+91 99400 11111',
      city: 'Coimbatore',
      contacts: [],
      services: [
        { serviceId: 's-dj', rateAmount: 8000, rateBasis: 'hours', rateNote: 'Min 3 hrs' },
        { serviceId: 's-candid', rateAmount: null, rateBasis: null, rateNote: '' },
      ],
    });
  });

  it('asks what a rate is per when only the amount is entered', async () => {
    const user = userEvent.setup();
    start('/vendors/new');
    await user.type(await screen.findByLabelText('Vendor name'), 'X');
    await user.type(screen.getByLabelText('Phone'), '98400 22222');
    await chooseServices(user, ['DJ / VDJ']);
    await user.type(screen.getByLabelText('Rate (₹) for DJ / VDJ'), '8000');
    await user.click(screen.getByRole('button', { name: 'Save vendor' }));
    expect(await screen.findByText('Choose what the rate is per')).toBeInTheDocument();
  });

  it('only offers active services in the picker', async () => {
    const user = userEvent.setup();
    start('/vendors/new');
    await user.click(await screen.findByRole('button', { name: 'Choose services' }));
    const dialog = await screen.findByRole('dialog', { name: 'Services offered' });
    expect(
      within(dialog).queryByRole('checkbox', { name: 'Sound System' }),
    ).not.toBeInTheDocument();
    await user.type(within(dialog).getByRole('searchbox', { name: 'Search services' }), 'cand');
    expect(within(dialog).getAllByRole('checkbox')).toHaveLength(1);
  });

  it('pre-selects the service from the empty directory state', async () => {
    start('/vendors/new?service=s-nada');
    expect(await screen.findByText('Nadaswaram')).toBeInTheDocument();
  });

  it('warns about a phone number that is already saved, but still saves', async () => {
    const user = userEvent.setup();
    const { backend } = start('/vendors/new');
    await user.type(await screen.findByLabelText('Vendor name'), 'Beat Republic Events');
    await user.type(screen.getByLabelText('Phone'), '98400 12345');
    await user.tab();

    const warning = await screen.findByText(/already saved for beat republic/i);
    expect(within(warning).getByRole('link', { name: /open their profile/i })).toHaveAttribute(
      'href',
      '/vendors/v-beat',
    );
    await chooseServices(user, ['DJ / VDJ']);
    await user.click(screen.getByRole('button', { name: 'Save vendor' }));
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Beat Republic Events' }),
    ).toBeInTheDocument();
    expect(posted(backend.calls, 'POST', '/vendors')).toMatchObject({ phone: '98400 12345' });
  });

  it('adds team contacts', async () => {
    const user = userEvent.setup();
    const { backend } = start('/vendors/new');
    await user.type(await screen.findByLabelText('Vendor name'), 'Shubh Decor');
    await user.type(screen.getByLabelText('Phone'), '98400 33333');
    await user.click(screen.getByRole('button', { name: 'Add contact' }));
    await user.type(screen.getByLabelText('Name of contact 1'), 'Meena');
    await user.type(screen.getByLabelText('Role of contact 1'), 'Lead decorator');
    await user.type(screen.getByLabelText('Phone of contact 1'), '98410 44444');
    await chooseServices(user, ['Emcee / Host']);
    await user.click(screen.getByRole('button', { name: 'Save vendor' }));

    await screen.findByRole('heading', { level: 1, name: 'Shubh Decor' });
    expect(posted(backend.calls, 'POST', '/vendors')).toMatchObject({
      contacts: [{ name: 'Meena', role: 'Lead decorator', phone: '98410 44444' }],
    });
  });
});

describe('S4 edit vendor', () => {
  it('loads saved values, keeps rates and saves changes', async () => {
    const user = userEvent.setup();
    const { backend } = start('/vendors/v-beat/edit');
    const city = await screen.findByLabelText('City');
    expect(city).toHaveValue('Chennai');
    expect(screen.getByLabelText('Rate (₹) for DJ / VDJ')).toHaveValue('8000');

    await user.clear(city);
    await user.type(city, 'Pondicherry');
    // Remove the emcee service; DJ keeps its rate.
    await user.click(screen.getByRole('button', { name: 'Remove Emcee / Host' }));
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByText('Entertainment · Pondicherry')).toBeInTheDocument();
    expect(posted(backend.calls, 'PATCH', '/vendors/v-beat')).toMatchObject({
      city: 'Pondicherry',
      services: [
        { serviceId: 's-dj', rateAmount: 8000, rateBasis: 'hours', rateNote: 'Min 3 hrs' },
      ],
    });
  });

  it('does not warn about the vendor’s own phone', async () => {
    const user = userEvent.setup();
    const { backend } = start('/vendors/v-beat/edit');
    await user.click(await screen.findByRole('textbox', { name: 'Phone' }));
    await user.tab();
    await vi.waitFor(() => {
      expect(posted(backend.calls, 'POST', '/vendors/phone-check')).toEqual({
        phone: '+91 98400 12345',
        exceptId: 'v-beat',
      });
    });
    expect(screen.queryByText(/already saved/i)).not.toBeInTheDocument();
  });

  it('keeps an archived service link when the selection changes', async () => {
    const user = userEvent.setup();
    const { backend } = start('/vendors/v-old/edit');
    expect(await screen.findByText('Sound System')).toBeInTheDocument();
    await chooseServices(user, ['DJ / VDJ']);
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    await vi.waitFor(() => {
      expect(posted(backend.calls, 'PATCH', '/vendors/v-old')).toMatchObject({
        services: [{ serviceId: 's-dj' }, { serviceId: 's-sound' }],
      });
    });
  });
});

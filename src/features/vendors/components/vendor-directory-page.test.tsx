import { screen, waitForElementToBeRemoved, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { renderVendors } from '../test/render';
import { createVendorsServer } from '../test/vendors-server';

// The Supabase session is the auth boundary, not the network: every HTTP call still goes through MSW.
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

function start(path = '/vendors', options: { empty?: boolean } = {}) {
  const backend = createVendorsServer(options);
  server.use(...backend.handlers);
  const { router } = renderVendors(path);
  return { backend, router };
}

const rail = () => screen.getByRole('navigation', { name: 'Categories' });
const rows = () =>
  within(screen.getByRole('table'))
    .getAllByRole('row')
    .slice(1)
    .map((row) => within(row).getAllByRole('link')[0]?.textContent);

describe('S3 vendor directory', () => {
  it('lists categories with vendor counts and every active vendor', async () => {
    start();
    expect(await screen.findByRole('link', { name: 'Beat Republic' })).toBeInTheDocument();
    expect(rows()).toEqual(['Beat Republic', 'Sruthi Laya Band']);
    expect(within(rail()).getByRole('button', { name: /all vendors, 2 vendors/i })).toHaveAttribute(
      'aria-current',
      'true',
    );
    expect(
      within(rail()).getByRole('button', { name: /entertainment, 2 vendors/i }),
    ).toBeInTheDocument();
    expect(
      within(rail()).getByRole('button', { name: /archived, 1 vendor$/i }),
    ).toBeInTheDocument();
  });

  it('shows a vendor under every category its services belong to (spec §9)', async () => {
    const user = userEvent.setup();
    start();
    await screen.findByRole('table');
    await user.click(
      within(rail()).getByRole('button', { name: /photography and videography, 1 vendor/i }),
    );
    expect(
      await screen.findByRole('heading', { name: 'Photography and Videography' }),
    ).toBeInTheDocument();
    expect(rows()).toEqual(['Sruthi Laya Band']);

    await user.click(within(rail()).getByRole('button', { name: /entertainment/i }));
    await screen.findByRole('heading', { name: 'Entertainment' });
    expect(await screen.findByRole('link', { name: 'Beat Republic' })).toBeInTheDocument();
    expect(rows()).toEqual(['Beat Republic', 'Sruthi Laya Band']);
  });

  it('the service filter shows only vendors offering that service, with counts', async () => {
    const user = userEvent.setup();
    start('/vendors?category=c-ent');
    await screen.findByRole('table');
    const chips = screen.getByRole('radiogroup', { name: 'Filter by service' });
    // Services without vendors (Nadaswaram) don't get a chip.
    expect(
      within(chips)
        .getAllByRole('radio')
        .map((chip) => chip.getAttribute('aria-label')),
    ).toEqual([
      'All, 2 vendors',
      'DJ / VDJ, 1 vendor',
      'Singers / Performers, 1 vendor',
      'Emcee / Host, 1 vendor',
    ]);

    await user.click(within(chips).getByRole('radio', { name: /singers/i }));
    expect(await screen.findByRole('link', { name: 'Sruthi Laya Band' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Beat Republic' })).not.toBeInTheDocument();
  });

  it('puts the browsed category’s service tags first on each row', async () => {
    start('/vendors?category=c-photo');
    const row = (await screen.findByRole('link', { name: 'Sruthi Laya Band' })).closest('tr');
    if (!row) throw new Error('row not found');
    const tags = within(row).getAllByRole('list', { name: 'Services' }).at(-1);
    expect(
      tags &&
        within(tags)
          .getAllByRole('listitem')
          .map((item) => item.textContent),
    ).toEqual(['Candid Photography', 'Singers / Performers']);
  });

  it('searches by name, city or phone after a short pause', async () => {
    const user = userEvent.setup();
    const { backend } = start();
    await screen.findByRole('table');
    await user.type(screen.getByRole('searchbox', { name: 'Search vendors' }), 'madurai');
    await waitForElementToBeRemoved(() => screen.queryByRole('link', { name: 'Beat Republic' }));
    expect(rows()).toEqual(['Sruthi Laya Band']);
    // Debounced: one request for the search, not one per keystroke.
    const searches = backend.calls.filter(
      (call) => call.method === 'GET' && call.path === '/vendors',
    );
    expect(searches.length).toBeLessThanOrEqual(2);
  });

  it('a search with no match offers Clear search', async () => {
    const user = userEvent.setup();
    start('/vendors?q=zzz');
    const heading = await screen.findByRole('heading', { name: 'No vendors match “zzz”' });
    const emptyState = heading.parentElement;
    if (!emptyState) throw new Error('empty state not found');
    await user.click(within(emptyState).getByRole('button', { name: 'Clear search' }));
    expect(await screen.findByRole('link', { name: 'Beat Republic' })).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: 'Search vendors' })).toHaveValue('');
  });

  it('an empty service filter offers to add a vendor with that service', async () => {
    start('/vendors?category=c-ent&service=s-nada');
    expect(
      await screen.findByRole('heading', { name: 'No vendors offer Nadaswaram yet' }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole('link', { name: 'Add vendor' }).map((link) => link.getAttribute('href')),
    ).toContain('/vendors/new?service=s-nada');
  });

  it('lists archived vendors separately', async () => {
    const user = userEvent.setup();
    start();
    await screen.findByRole('table');
    await user.click(within(rail()).getByRole('button', { name: /archived/i }));
    expect(await screen.findByRole('link', { name: 'Old Sound Co' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Archived vendors' })).toBeInTheDocument();
  });

  it('invites the first vendor when there are none', async () => {
    start('/vendors', { empty: true });
    expect(
      await screen.findByRole('heading', { name: 'Add your first vendor' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Add vendor' })).toHaveAttribute(
      'href',
      '/vendors/new',
    );
  });
});

import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { createCatalogueServer } from '../test/catalogue-server';
import { renderAt } from '../test/render';
import { CataloguePage } from './catalogue-page';

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

function start(options: { canReset?: boolean; path?: string } = {}) {
  const backend = createCatalogueServer(options);
  server.use(...backend.handlers);
  renderAt(options.path ?? '/settings/catalogue', <CataloguePage />);
  return backend;
}

const servicesTable = () => screen.getByRole('table');
const rowFor = (name: RegExp) => within(servicesTable()).getByRole('row', { name });

describe('S2 service catalogue', () => {
  it('lists categories with active-service counts and opens the first one', async () => {
    start();
    expect(
      await screen.findByRole('heading', { name: 'Photography and Videography' }),
    ).toBeInTheDocument();
    const rail = screen.getByRole('navigation', { name: 'Categories' });
    expect(
      within(rail).getByRole('button', { name: /photography and videography, 3 services/i }),
    ).toHaveAttribute('aria-current', 'true');
    expect(within(rail).getByRole('button', { name: /decor, 1 service$/i })).toBeInTheDocument();
    expect(within(rail).getByText('Archived (1)')).toBeInTheDocument();
  });

  it("shows Inherit or the override, so a service's override visibly wins over the category", async () => {
    start();
    await screen.findByRole('table');
    expect(within(rowFor(/candid photography/i)).getAllByText('Inherit').length).toBeGreaterThan(0);
    expect(
      within(rowFor(/drone coverage/i)).getAllByText(/^(Parameters: )?Hours$/).length,
    ).toBeGreaterThan(0);
    expect(within(rowFor(/albums/i)).getAllByText(/^(Parameters: )?Work$/).length).toBeGreaterThan(
      0,
    );
  });

  it('hides a service from the client form with the toggle', async () => {
    const user = userEvent.setup();
    const backend = start();
    const toggle = await screen.findByRole('switch', {
      name: /show candid photography on the client form/i,
    });
    expect(toggle).toBeChecked();

    await user.click(toggle);

    expect(backend.calls).toContainEqual({
      method: 'PATCH',
      path: '/catalogue/services/s-candid',
      body: { showOnClientForm: false },
    });
    expect(await within(rowFor(/candid photography/i)).findByText('Hidden')).toBeInTheDocument();
  });

  it('adds a service with its own parameters', async () => {
    const user = userEvent.setup();
    const backend = start();
    await user.click(await screen.findByRole('button', { name: 'Add service' }));

    const dialog = await screen.findByRole('dialog', { name: 'Add service' });
    await user.type(within(dialog).getByLabelText('Service name'), 'Same-Day Highlight Reel');
    await user.click(within(dialog).getByLabelText('Choose for this service'));
    await user.click(within(dialog).getByRole('button', { name: 'Hours' }));
    await user.click(within(dialog).getByRole('button', { name: 'Save service' }));

    expect(
      await screen.findByRole('row', { name: /same-day highlight reel/i }),
    ).toBeInTheDocument();
    expect(backend.calls).toContainEqual({
      method: 'POST',
      path: '/catalogue/categories/c-photo/services',
      body: {
        name: 'Same-Day Highlight Reel',
        description: '',
        showOnClientForm: true,
        parametersOverride: ['hours'],
      },
    });
  });

  it('asks for a parameter when overriding with none chosen', async () => {
    const user = userEvent.setup();
    const backend = start();
    await user.click(await screen.findByRole('button', { name: 'Add service' }));
    const dialog = await screen.findByRole('dialog', { name: 'Add service' });
    await user.type(within(dialog).getByLabelText('Service name'), 'Reel');
    await user.click(within(dialog).getByLabelText('Choose for this service'));
    await user.click(within(dialog).getByRole('button', { name: 'Save service' }));

    expect(await within(dialog).findByText(/choose at least one parameter/i)).toBeInTheDocument();
    expect(backend.calls.filter((call) => call.method === 'POST')).toHaveLength(0);
  });

  it('renames a category, and shows the server message for a duplicate name', async () => {
    const user = userEvent.setup();
    const backend = start();
    await user.click(
      await screen.findByRole('button', { name: 'Actions for Photography and Videography' }),
    );
    await user.click(await screen.findByRole('menuitem', { name: 'Rename category' }));

    const dialog = await screen.findByRole('dialog', { name: 'Rename category' });
    const input = within(dialog).getByLabelText('Category name');
    await user.clear(input);
    await user.type(input, 'decor');
    await user.click(within(dialog).getByRole('button', { name: 'Rename' }));
    expect(
      await within(dialog).findByText('A category named "decor" already exists.'),
    ).toBeInTheDocument();

    await user.clear(input);
    await user.type(input, 'Photo and Video');
    await user.click(within(dialog).getByRole('button', { name: 'Rename' }));
    expect(await screen.findByRole('heading', { name: 'Photo and Video' })).toBeInTheDocument();
    expect(backend.calls.at(-1)).toEqual({
      method: 'PATCH',
      path: '/catalogue/categories/c-photo',
      body: { name: 'Photo and Video' },
    });
  });

  it('moves a service down from the menu (the alternative to dragging), keeping archived ones last', async () => {
    const user = userEvent.setup();
    const backend = start();
    await user.click(await screen.findByRole('button', { name: 'Actions for Candid Photography' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Move down' }));

    expect(backend.calls).toContainEqual({
      method: 'PUT',
      path: '/catalogue/categories/c-photo/services/order',
      body: { ids: ['s-drone', 's-candid', 's-albums', 's-booth'] },
    });
    const rows = within(servicesTable()).getAllByRole('row').slice(1);
    expect(rows[0]).toHaveAccessibleName(/drone coverage/i);
  });

  it('archives a service with Undo, and restores an archived one', async () => {
    const user = userEvent.setup();
    const backend = start();
    await user.click(await screen.findByRole('button', { name: 'Actions for Drone Coverage' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Archive service' }));

    expect(await screen.findByText('Archived Drone Coverage')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Undo' }));
    expect(backend.calls.at(-1)).toEqual({
      method: 'PATCH',
      path: '/catalogue/services/s-drone',
      body: { archived: false },
    });

    await user.click(screen.getByRole('button', { name: /archived services \(1\)/i }));
    await user.click(screen.getByRole('button', { name: 'Restore Photo Booth' }));
    expect(await screen.findByRole('row', { name: /photo booth/i })).toBeInTheDocument();
  });

  it('shows size labels only for a category with the Size parameter', async () => {
    start({ path: '/settings/catalogue?category=c-decor' });
    expect(await screen.findByRole('heading', { name: 'Decor' })).toBeInTheDocument();
    const labels = screen.getByRole('list', { name: 'Size labels for Decor' });
    expect(
      within(labels)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(['Stage', 'Hall', 'Lawn']);
    expect(screen.getByRole('switch', { name: /pre-fill pax/i })).toBeDisabled();
  });

  it("changes a category's parameters from the chips", async () => {
    const user = userEvent.setup();
    const backend = start();
    const hours = await screen.findByRole('button', { name: 'Hours' });
    expect(hours).toHaveAttribute('aria-pressed', 'true');
    await user.click(hours);
    expect(backend.calls).toContainEqual({
      method: 'PATCH',
      path: '/catalogue/categories/c-photo',
      body: { parameters: ['pax'] },
    });
    expect(screen.queryByRole('list', { name: /size labels/i })).not.toBeInTheDocument();
  });

  it('offers Reset to template only before the first event', async () => {
    const user = userEvent.setup();
    start({ canReset: false });
    await user.click(await screen.findByRole('button', { name: 'Catalogue options' }));
    const item = await screen.findByRole('menuitem', { name: /reset to template/i });
    expect(item).toHaveAttribute('aria-disabled', 'true');
    expect(item).toHaveTextContent('Only before your first event');
  });

  it('resets the catalogue after confirming', async () => {
    const user = userEvent.setup();
    const backend = start({ canReset: true });
    await user.click(await screen.findByRole('button', { name: 'Catalogue options' }));
    await user.click(await screen.findByRole('menuitem', { name: /reset to template/i }));
    const confirm = await screen.findByRole('alertdialog', { name: /replace your catalogue/i });
    await user.click(within(confirm).getByRole('button', { name: 'Reset catalogue' }));

    expect(await screen.findByText('Catalogue reset to the template')).toBeInTheDocument();
    expect(backend.calls).toContainEqual({
      method: 'POST',
      path: '/catalogue/reset',
      body: undefined,
    });
  });
});

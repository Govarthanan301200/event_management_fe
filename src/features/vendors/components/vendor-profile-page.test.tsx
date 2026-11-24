import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

const section = (name: string) => screen.getByRole('region', { name });
const normalise = (text: string | null) => (text ?? '').replace(/\s/g, ' ');

describe('S4 vendor profile', () => {
  it('shows the four parts, with click-to-call and WhatsApp', async () => {
    start('/vendors/v-beat');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Beat Republic' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Entertainment · Chennai')).toBeInTheDocument();

    const basic = section('Basic information');
    expect(within(basic).getByRole('link', { name: /call \+91 98400 12345/i })).toHaveAttribute(
      'href',
      'tel:+919840012345',
    );
    expect(within(basic).getByRole('link', { name: /whatsapp/i })).toHaveAttribute(
      'href',
      'https://wa.me/919840012345',
    );
    expect(within(section('Team')).getByText(/karthik/i)).toBeInTheDocument();
    expect(
      within(section('Planner notes')).getByText('Reliable, brings own sound.'),
    ).toBeInTheDocument();
  });

  it('lists services with optional rates (spec §9: rates are optional)', async () => {
    start('/vendors/v-beat');
    const services = await screen.findByRole('region', { name: 'Services and rates' });
    const items = within(services)
      .getAllByRole('listitem')
      .map((item) => normalise(item.textContent));
    expect(items[0]).toContain('₹8,000 per hour');
    expect(items[0]).toContain('Min 3 hrs');
    expect(items[1]).toContain('₹25,000 package');
  });

  it('a vendor with no rates is fully usable and offers "Add rate"', async () => {
    start('/vendors/v-sruthi');
    const services = await screen.findByRole('region', { name: 'Services and rates' });
    expect(within(services).getAllByText(/no rate/i)).toHaveLength(2);
    expect(
      within(services).getByRole('link', { name: 'Add rate for Candid Photography' }),
    ).toHaveAttribute('href', '/vendors/v-sruthi/edit');
  });

  it('marks archived services and an archived vendor, with Restore', async () => {
    const user = userEvent.setup();
    const { backend } = start('/vendors/v-old');
    const services = await screen.findByRole('region', { name: 'Services and rates' });
    expect(within(services).getByText('Archived')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(/archived\. this vendor is hidden/i);

    await user.click(screen.getByRole('button', { name: 'Restore' }));
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Old Sound Co' }),
    ).toBeInTheDocument();
    expect(backend.calls).toContainEqual({
      method: 'PATCH',
      path: '/vendors/v-old',
      body: { archived: false },
    });
  });

  it('archives with a 5-second Undo (spec §6: a vendor is archived, not deleted)', async () => {
    const user = userEvent.setup();
    const { backend } = start('/vendors/v-beat');
    await user.click(await screen.findByRole('button', { name: 'Actions for Beat Republic' }));
    await user.click(screen.getByRole('menuitem', { name: 'Archive' }));
    expect(await screen.findByText('Archived Beat Republic')).toBeInTheDocument();
    expect(backend.calls).toContainEqual({
      method: 'PATCH',
      path: '/vendors/v-beat',
      body: { archived: true },
    });

    await user.click(screen.getByRole('button', { name: 'Undo' }));
    await vi.waitFor(() => {
      expect(backend.calls).toContainEqual({
        method: 'PATCH',
        path: '/vendors/v-beat',
        body: { archived: false },
      });
    });
  });

  it('deletes an unused vendor after confirmation', async () => {
    const user = userEvent.setup();
    const { backend, router } = start('/vendors/v-sruthi');
    await user.click(await screen.findByRole('button', { name: 'Actions for Sruthi Laya Band' }));
    await user.click(screen.getByRole('menuitem', { name: 'Delete' }));
    const dialog = await screen.findByRole('alertdialog', { name: 'Delete Sruthi Laya Band?' });
    await user.click(within(dialog).getByRole('button', { name: 'Delete vendor' }));

    expect(await screen.findByRole('heading', { name: 'Vendors' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/vendors');
    expect(backend.calls).toContainEqual({
      method: 'DELETE',
      path: '/vendors/v-sruthi',
      body: undefined,
    });
  });

  it('says so when the vendor does not exist', async () => {
    start('/vendors/v-missing');
    expect(await screen.findByRole('alert')).toHaveTextContent(/doesn’t exist/i);
  });
});

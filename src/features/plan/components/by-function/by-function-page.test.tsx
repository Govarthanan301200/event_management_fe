import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { createPlanServer } from '../../test/plan-server';
import { renderPlan } from '../../test/render';

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

// Seed (plan-server.ts): Catering has row budgets (Mehendi ₹75,000 with the line vendor,
// Reception ₹5,00,000 with Saravana per function); Candid Photography has a ₹1,80,000 line budget
// across Sangeet and Reception, so it is Shared.
function start(path = '/events/e1/by-function', options: { noFunctions?: boolean } = {}) {
  const backend = createPlanServer(options);
  server.use(...backend.handlers);
  return renderPlan(path);
}

const group = (name: string) => screen.getByRole('region', { name });

describe('S9 plan by function (spec §12)', () => {
  it('opens on the next function with its services, vendor, quantities and budget', async () => {
    start();
    expect(await screen.findByRole('heading', { name: 'Mehendi', level: 2 })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Mehendi/, pressed: true })).toBeInTheDocument();
    expect(screen.getByText('Mehendi total').nextSibling).toHaveTextContent('₹75,000');

    const food = group('Food and Beverage');
    expect(within(food).getByRole('button', { name: 'Catering' })).toBeInTheDocument();
    expect(within(food).getByText('Annapoorna Caterers · 150 pax')).toBeInTheDocument();
    expect(within(food).getAllByText('₹75,000')).toHaveLength(2); // band and line
    // Candid Photography doesn't cover Mehendi.
    expect(screen.queryByRole('region', { name: 'Shared across event' })).not.toBeInTheDocument();
  });

  it('shows a per-function vendor as changed and Shared lines apart, without splitting them', async () => {
    const user = userEvent.setup();
    start();
    await user.click(await screen.findByRole('button', { name: /Reception/ }));

    expect(await screen.findByRole('heading', { name: 'Reception', level: 2 })).toBeInTheDocument();
    const food = group('Food and Beverage');
    expect(within(food).getByText('Saravana Caterers · 1,000 pax')).toBeInTheDocument();
    expect(within(food).getByText('changed')).toBeInTheDocument();

    const shared = group('Shared across event');
    expect(within(shared).getByRole('button', { name: 'Candid Photography' })).toBeInTheDocument();
    expect(within(shared).getByText('Shared')).toBeInTheDocument();
    expect(within(shared).getByText('₹1,80,000 across 2 functions')).toBeInTheDocument();
    // The Shared budget is not part of Reception's total.
    expect(screen.getByText('Reception total').nextSibling).toHaveTextContent('₹5,00,000');
  });

  it('opens the function named in the link, and invites planning when nothing covers it', async () => {
    start('/events/e1/by-function?fn=f-sangeet');
    expect(await screen.findByRole('heading', { name: 'Sangeet', level: 2 })).toBeInTheDocument();
    expect(screen.getByText('Sangeet total').nextSibling).toHaveTextContent('₹0');
    expect(group('Shared across event')).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Food and Beverage' })).not.toBeInTheDocument();
  });

  it('opens the S8 drawer from a service name', async () => {
    const user = userEvent.setup();
    start();
    await user.click(await screen.findByRole('button', { name: 'Catering' }));
    expect(await screen.findByRole('dialog', { name: 'Edit Catering' })).toBeInTheDocument();
  });

  it('asks for functions first', async () => {
    start('/events/e1/by-function', { noFunctions: true });
    expect(await screen.findByRole('heading', { name: 'Add functions first' })).toBeInTheDocument();
  });
});

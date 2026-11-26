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
  vi.restoreAllMocks();
});
afterAll(() => {
  server.close();
});

// Seed (plan-server.ts): budget ₹25,00,000. Food and Beverage: Mehendi ₹75,000 + Reception
// ₹5,00,000 = ₹5,75,000 against a ₹5,00,000 envelope (₹75,000 over). Photography: a ₹1,80,000
// line budget across Sangeet and Reception, so Shared. Planned ₹7,55,000.
function start(path = '/events/e1/summary') {
  const backend = createPlanServer();
  server.use(...backend.handlers);
  return renderPlan(path);
}

/** The jsdom matchMedia never matches; this makes the ≥1024px grid render. */
function wideScreen() {
  const original = window.matchMedia.bind(window);
  // The setup mock returns a fresh plain object per call, so overriding `matches` is safe.
  vi.spyOn(window, 'matchMedia').mockImplementation((query: string) =>
    Object.assign(original(query), { matches: query === '(min-width: 1024px)' }),
  );
}

const card = (label: string) => {
  const term = screen.getByText(label, { selector: 'dt' });
  const value = term.nextElementSibling;
  if (!(value instanceof HTMLElement)) throw new Error(`No value for ${label}`);
  return value;
};

describe('S10 summary (spec §12)', () => {
  it('shows the headline cards: budget, planned, left and categories over', async () => {
    start();
    expect(await screen.findByText('Budget', { selector: 'dt' })).toBeInTheDocument();
    expect(card('Budget')).toHaveTextContent('₹25,00,000');
    expect(card('Planned')).toHaveTextContent('₹7,55,000');
    expect(card('Planned')).toHaveTextContent('2 services');
    expect(card('Left')).toHaveTextContent('₹17,45,000');
    expect(card('Over envelope')).toHaveTextContent('⚠ 1');
    expect(card('Over envelope')).toHaveTextContent('of 1 with an envelope');
  });

  it('adds the By function and Summary tabs to the workspace', async () => {
    start();
    const tabs = await screen.findByRole('navigation', { name: 'Event sections' });
    expect(within(tabs).getByRole('link', { name: 'By function' })).toHaveAttribute(
      'href',
      '/events/e1/by-function',
    );
    expect(within(tabs).getByRole('link', { name: 'Summary' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  describe('grid (1024px and up)', () => {
    it('lays out category × function with Shared, Total and Envelope, and reconciles', async () => {
      wideScreen();
      start();
      const table = await screen.findByRole('table');
      const headers = within(table)
        .getAllByRole('columnheader')
        .map((th) => th.textContent);
      expect(headers).toEqual([
        'Category',
        expect.stringContaining('Mehendi'),
        expect.stringContaining('Sangeet'),
        expect.stringContaining('Reception'),
        'Shared',
        'Total',
        'Envelope',
      ]);

      const [, food, photo, total] = within(table).getAllByRole('row');
      const cells = (row: HTMLElement | undefined) =>
        row
          ? within(row)
              .getAllByRole('cell')
              .map((td) => td.textContent)
          : [];
      expect(cells(food)).toEqual([
        '75,000',
        '—None',
        '5,00,000',
        '—None',
        '⚠ 5,75,000',
        '5,00,000',
      ]);
      expect(cells(photo)).toEqual(['—None', '—None', '—None', '1,80,000', '1,80,000', '—None']);
      // Σ function totals + Shared = planned: 75,000 + 0 + 5,00,000 + 1,80,000 = 7,55,000.
      expect(cells(total)).toEqual(['75,000', '0', '5,00,000', '1,80,000', '7,55,000', '5,00,000']);
    });

    it('flags an over-envelope total with ⚠ and words, not colour alone', async () => {
      wideScreen();
      start();
      expect(
        await screen.findByRole('link', {
          name: 'Food and Beverage total ₹5,75,000, ₹75,000 over envelope',
        }),
      ).toHaveAttribute('href', '/events/e1/plan#band-c-food');
    });

    it('links function headers and cells to S9, and category rows to S7', async () => {
      const user = userEvent.setup();
      wideScreen();
      start();
      const table = await screen.findByRole('table');
      expect(
        within(table).getByRole('link', { name: 'Food and Beverage at Reception: ₹5,00,000' }),
      ).toHaveAttribute('href', '/events/e1/by-function?fn=f-reception#fn-cat-c-food');
      expect(within(table).getByRole('link', { name: 'Food and Beverage' })).toHaveAttribute(
        'href',
        '/events/e1/plan#band-c-food',
      );

      await user.click(within(table).getByRole('link', { name: /^Sangeet,/ }));
      expect(await screen.findByRole('heading', { name: 'Sangeet', level: 2 })).toBeInTheDocument();
    });
  });

  describe('cards (below 1024px)', () => {
    it('shows each category against its envelope, then the total', async () => {
      start();
      const food = await screen.findByRole('link', { name: /Food and Beverage/ });
      expect(food).toHaveTextContent('₹5,75,000');
      expect(food).toHaveTextContent('⚠ ₹75,000 over ₹5,00,000');
      expect(food).toHaveAttribute('href', '/events/e1/plan#band-c-food');
      expect(screen.getByRole('link', { name: /Photography/ })).toHaveTextContent('No envelope');
      expect(screen.getByText('Total planned').parentElement).toHaveTextContent('₹7,55,000');
    });

    it('switches to one function or the Shared column', async () => {
      const user = userEvent.setup();
      start();
      const switcher = await screen.findByRole('group', { name: 'Show amounts for' });

      await user.click(within(switcher).getByRole('button', { name: 'Reception' }));
      const food = screen.getByRole('link', { name: /Food and Beverage/ });
      expect(food).toHaveTextContent('₹5,00,000');
      expect(food).toHaveAttribute('href', '/events/e1/by-function?fn=f-reception#fn-cat-c-food');
      expect(screen.queryByRole('link', { name: /Photography/ })).not.toBeInTheDocument();
      expect(screen.getByText('Reception total').parentElement).toHaveTextContent('₹5,00,000');

      await user.click(within(switcher).getByRole('button', { name: 'Shared' }));
      expect(screen.getByRole('link', { name: /Photography/ })).toHaveTextContent('₹1,80,000');
      expect(screen.queryByRole('link', { name: /Food and Beverage/ })).not.toBeInTheDocument();

      await user.click(within(switcher).getByRole('button', { name: 'Sangeet' }));
      expect(screen.getByText('Nothing planned for Sangeet yet.')).toBeInTheDocument();
    });
  });
});

describe('S7 opened from S10', () => {
  it('scrolls to the category band in the link', async () => {
    const scroll = vi.spyOn(Element.prototype, 'scrollIntoView');
    start('/events/e1/plan#band-c-photo');
    await screen.findByRole('region', { name: 'Photography and Videography' });
    await vi.waitFor(() => {
      expect(scroll).toHaveBeenCalled();
    });
    expect(scroll.mock.contexts[0]).toHaveAttribute('id', 'band-c-photo');
  });
});

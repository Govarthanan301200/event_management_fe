import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { ClientFormPage } from './client-form-page';

const TOKEN = 'A'.repeat(43);
const API = `http://api.test/api/v1/public/f/${TOKEN}`;

const form = (overrides: Record<string, unknown> = {}) => ({
  company: { name: 'Shubh Aarambh Events', logoUrl: null },
  state: 'open',
  submittedAt: null,
  sections: [
    {
      id: 'c-food',
      name: 'Food and Beverage',
      services: [
        {
          id: 's-catering',
          name: 'Catering (Veg / Non-Veg / Multi-Cuisine)',
          description: 'Full menu planning and service',
        },
        {
          id: 's-cake',
          name: 'Wedding / Event Cake',
          description: 'Custom thematic celebration cakes',
        },
      ],
    },
    {
      id: 'c-ent',
      name: 'Entertainment',
      services: [
        { id: 's-nadaswaram', name: 'Nadaswaram', description: 'Traditional musical instruments' },
      ],
    },
  ],
  selections: [],
  ...overrides,
});

let submitted: unknown[] = [];
let idempotencyKeys: (string | null)[] = [];
const server = setupServer();

beforeAll(() => {
  server.listen({ onUnhandledFrame: 'error' });
});
afterEach(() => {
  server.resetHandlers();
  submitted = [];
  idempotencyKeys = [];
});
afterAll(() => {
  server.close();
});

function serve(body: object, status = 200) {
  server.use(
    http.get(API, () => HttpResponse.json(status === 200 ? { data: body } : body, { status })),
    http.post(`${API}/submissions`, async ({ request }) => {
      submitted.push(await request.json());
      idempotencyKeys.push(request.headers.get('Idempotency-Key'));
      return HttpResponse.json(
        { data: { submittedAt: '2027-02-02T12:40:00.000Z', selectedCount: 1 } },
        { status: 201 },
      );
    }),
  );
}

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const router = createMemoryRouter([{ path: '/f/:token', element: <ClientFormPage /> }], {
    initialEntries: [`/f/${TOKEN}`],
  });
  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

describe('client requirement form (S1)', () => {
  it('shows the company, sections and services without any login', async () => {
    serve(form());
    renderPage();
    expect(await screen.findByRole('heading', { name: 'Plan your wedding' })).toBeInTheDocument();
    expect(screen.getByText('Shubh Aarambh Events')).toBeInTheDocument();
    expect(screen.getByText('SA')).toBeInTheDocument(); // monogram when there's no logo
    expect(screen.getByRole('region', { name: /food and beverage/i })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /catering/i })).toBeInTheDocument();
  });

  it('ticking a service reveals its note field and updates the counts', async () => {
    const user = userEvent.setup();
    serve(form());
    renderPage();

    const catering = await screen.findByRole('checkbox', { name: /catering/i });
    expect(screen.queryByLabelText(/note for your planner/i)).not.toBeInTheDocument();
    await user.click(catering);

    expect(screen.getByLabelText(/note for your planner/i)).toBeInTheDocument();
    const food = screen.getByRole('region', { name: /food and beverage/i });
    expect(within(food).getByText(/1 selected/)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /send to planner · 1 selected/i }),
    ).toBeInTheDocument();
  });

  it('sends ticked services with notes and an idempotency key, then thanks the client', async () => {
    const user = userEvent.setup();
    serve(form());
    renderPage();

    await user.click(await screen.findByRole('checkbox', { name: /catering/i }));
    await user.type(
      screen.getByLabelText(/note for your planner/i),
      'Mostly veg, one non-veg dinner',
    );
    await user.click(screen.getByRole('button', { name: /send to planner/i }));

    expect(
      await screen.findByRole('heading', { name: /thank you! your planner has your list/i }),
    ).toBeInTheDocument();
    expect(submitted).toEqual([
      { selections: [{ serviceId: 's-catering', note: 'Mostly veg, one non-veg dinner' }] },
    ]);
    expect(idempotencyKeys[0]).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('asks for at least one service instead of sending an empty list', async () => {
    const user = userEvent.setup();
    serve(form());
    renderPage();

    await user.click(await screen.findByRole('button', { name: /send to planner/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/tick at least one service/i);
    expect(submitted).toEqual([]);
  });

  it('pre-fills previous answers and notes on resubmission', async () => {
    serve(
      form({
        submittedAt: '2027-02-02T12:40:00.000Z',
        selections: [{ serviceId: 's-nadaswaram', note: 'For the Muhurtham only' }],
      }),
    );
    renderPage();

    expect(await screen.findByRole('checkbox', { name: /nadaswaram/i })).toBeChecked();
    expect(screen.getByLabelText(/note for your planner/i)).toHaveValue('For the Muhurtham only');
    expect(screen.getByText(/you sent your list on 2 feb 2027/i)).toBeInTheDocument();
  });

  it('shows a read-only summary when the planner has locked the form', async () => {
    serve(form({ state: 'locked', selections: [{ serviceId: 's-cake', note: null }] }));
    renderPage();

    expect(await screen.findByRole('heading', { name: 'Your wedding list' })).toBeInTheDocument();
    expect(screen.getByText('Wedding / Event Cake')).toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /send to planner/i })).not.toBeInTheDocument();
  });

  it('shows the same unavailable page for an unknown link', async () => {
    serve({ error: { code: 'FORM_LINK_UNAVAILABLE', message: 'x' } }, 404);
    renderPage();
    expect(
      await screen.findByRole('heading', { name: /this link isn't available/i }),
    ).toBeInTheDocument();
  });

  it('keeps the unsent answers when sending fails', async () => {
    const user = userEvent.setup();
    serve(form());
    server.use(
      http.post(`${API}/submissions`, () =>
        HttpResponse.json(
          { error: { code: 'INTERNAL', message: 'Something went wrong. Try again.' } },
          { status: 500 },
        ),
      ),
    );
    renderPage();

    await user.click(await screen.findByRole('checkbox', { name: /catering/i }));
    await user.click(screen.getByRole('button', { name: /send to planner/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/couldn't send your list/i);
    expect(screen.getByRole('checkbox', { name: /catering/i })).toBeChecked();
  });
});

import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { API, type Recorded } from '../test/catalogue-server';
import { renderAt } from '../test/render';
import { FunctionTypesPage } from './function-types-page';

vi.mock('@/features/auth/api/supabase', () => ({
  getAccessToken: () => Promise.resolve('test-token'),
}));

type TypeRecord = { id: string; name: string; sortOrder: number; archivedAt: string | null };

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

function start() {
  const calls: Recorded[] = [];
  const types: TypeRecord[] = [
    { id: 't-mehendi', name: 'Mehendi', sortOrder: 0, archivedAt: null },
    { id: 't-sangeet', name: 'Sangeet', sortOrder: 1, archivedAt: null },
    { id: 't-muhurtham', name: 'Muhurtham / Wedding', sortOrder: 2, archivedAt: null },
    { id: 't-cocktail', name: 'Cocktail', sortOrder: 3, archivedAt: '2026-11-20T10:00:00.000Z' },
  ];
  const body = async (request: Request) => {
    const text = await request.text();
    const parsed = text ? (JSON.parse(text) as Record<string, unknown>) : undefined;
    calls.push({
      method: request.method,
      path: new URL(request.url).pathname.replace('/api/v1', ''),
      body: parsed,
    });
    return parsed ?? {};
  };
  const sorted = () => [...types].sort((a, b) => a.sortOrder - b.sortOrder);

  server.use(
    http.get(`${API}/function-types`, () => HttpResponse.json({ data: sorted() })),
    http.post(`${API}/function-types`, async ({ request }) => {
      const { name } = await body(request);
      if (String(name).toLowerCase() === 'mehendi') {
        return HttpResponse.json(
          {
            error: { code: 'CONFLICT', message: 'A function type named "mehendi" already exists.' },
          },
          { status: 409 },
        );
      }
      const created = {
        id: `t-${types.length}`,
        name: String(name),
        sortOrder: types.length,
        archivedAt: null,
      };
      types.push(created);
      return HttpResponse.json({ data: created }, { status: 201 });
    }),
    http.patch(`${API}/function-types/:id`, async ({ request, params }) => {
      const change = await body(request);
      const type = types.find((item) => item.id === params.id);
      if (!type)
        return HttpResponse.json(
          { error: { code: 'NOT_FOUND', message: 'Not found' } },
          { status: 404 },
        );
      if (typeof change.name === 'string') type.name = change.name;
      if (change.archived !== undefined)
        type.archivedAt = change.archived ? new Date().toISOString() : null;
      return HttpResponse.json({ data: type });
    }),
    http.put(`${API}/function-types/order`, async ({ request }) => {
      const { ids } = (await body(request)) as { ids: string[] };
      ids.forEach((id, index) => {
        const type = types.find((item) => item.id === id);
        if (type) type.sortOrder = index;
      });
      return new HttpResponse(null, { status: 204 });
    }),
  );
  renderAt('/settings/function-types', <FunctionTypesPage />);
  return calls;
}

const activeNames = () =>
  within(screen.getByRole('list', { name: 'Function types' }))
    .getAllByRole('listitem')
    .map((item) => item.textContent);

describe('Settings › Function types', () => {
  it('lists active types in order and folds archived ones away', async () => {
    start();
    expect(await screen.findByText('Mehendi')).toBeInTheDocument();
    expect(activeNames()).toEqual(['Mehendi', 'Sangeet', 'Muhurtham / Wedding']);
    expect(
      screen.getByRole('button', { name: /archived function types \(1\)/i }),
    ).toBeInTheDocument();
  });

  it('adds a type, refusing a duplicate with the server message', async () => {
    const user = userEvent.setup();
    start();
    await user.click(await screen.findByRole('button', { name: 'Add function type' }));
    const dialog = await screen.findByRole('dialog', { name: 'Add function type' });
    await user.type(within(dialog).getByLabelText('Name'), 'mehendi');
    await user.click(within(dialog).getByRole('button', { name: 'Add function type' }));
    expect(
      await within(dialog).findByText('A function type named "mehendi" already exists.'),
    ).toBeInTheDocument();

    await user.clear(within(dialog).getByLabelText('Name'));
    await user.type(within(dialog).getByLabelText('Name'), 'Nalangu');
    await user.click(within(dialog).getByRole('button', { name: 'Add function type' }));
    expect(await screen.findByText('Nalangu')).toBeInTheDocument();
  });

  it('renames a type', async () => {
    const user = userEvent.setup();
    const calls = start();
    await user.click(await screen.findByRole('button', { name: 'Actions for Sangeet' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Rename' }));
    const dialog = await screen.findByRole('dialog', { name: 'Rename function type' });
    await user.clear(within(dialog).getByLabelText('Name'));
    await user.type(within(dialog).getByLabelText('Name'), 'Sangeet Night');
    await user.click(within(dialog).getByRole('button', { name: 'Rename' }));

    expect(await screen.findByText('Sangeet Night')).toBeInTheDocument();
    expect(calls.at(-1)).toEqual({
      method: 'PATCH',
      path: '/function-types/t-sangeet',
      body: { name: 'Sangeet Night' },
    });
  });

  it('moves a type up, sending archived ones last', async () => {
    const user = userEvent.setup();
    const calls = start();
    await user.click(
      await screen.findByRole('button', { name: 'Actions for Muhurtham / Wedding' }),
    );
    await user.click(await screen.findByRole('menuitem', { name: 'Move up' }));

    expect(calls).toContainEqual({
      method: 'PUT',
      path: '/function-types/order',
      body: { ids: ['t-mehendi', 't-muhurtham', 't-sangeet', 't-cocktail'] },
    });
    expect(activeNames()).toEqual(['Mehendi', 'Muhurtham / Wedding', 'Sangeet']);
  });

  it('archives a type and restores an archived one', async () => {
    const user = userEvent.setup();
    start();
    await user.click(await screen.findByRole('button', { name: 'Actions for Mehendi' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Archive' }));
    expect(await screen.findByText('Archived Mehendi')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /archived function types \(2\)/i }));
    await user.click(screen.getByRole('button', { name: 'Restore Cocktail' }));
    expect(await screen.findByRole('button', { name: 'Actions for Cocktail' })).toBeInTheDocument();
  });
});

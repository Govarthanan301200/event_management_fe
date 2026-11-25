import { http, HttpResponse } from 'msw';
import type { EventFunction, EventStatus, FunctionInput } from '../api/events.schema';

// An in-memory events backend for MSW (S5 + S6): reads reflect writes, like the real API.

export const API = 'http://api.test/api/v1';

type EventRecord = {
  id: string;
  name: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string | null;
  overallBudget: number | null;
  status: EventStatus;
  formToken: string;
  formLocked: boolean;
  formSubmittedAt: string | null;
  createdAt: string;
  functions: EventFunction[];
};

export type Recorded = { method: string; path: string; body: unknown };

const TYPES = [
  { id: 't-mehendi', name: 'Mehendi', sortOrder: 0, archivedAt: null },
  { id: 't-sangeet', name: 'Sangeet', sortOrder: 1, archivedAt: null },
  { id: 't-muhurtham', name: 'Muhurtham / Wedding', sortOrder: 2, archivedAt: null },
  { id: 't-haldi', name: 'Haldi', sortOrder: 3, archivedAt: '2026-11-20T10:00:00.000Z' },
];

const today = () => new Date().toISOString().slice(0, 10);

const fn = (
  id: string,
  typeId: string | null,
  name: string,
  date: string,
  extra: Partial<EventFunction> = {},
): EventFunction => ({
  id,
  functionTypeId: typeId,
  customName: typeId ? null : name,
  name,
  functionTypeArchived: false,
  date,
  startTime: '11:00',
  endTime: null,
  venueName: null,
  venueAddress: null,
  guestCount: 150,
  sortOrder: 0,
  ...extra,
});

function seed(): EventRecord[] {
  const base = {
    clientEmail: null,
    overallBudget: null,
    formLocked: false,
    formSubmittedAt: null,
    formToken: 'x'.repeat(43),
    createdAt: '2026-11-20T10:00:00.000Z',
  };
  return [
    {
      ...base,
      id: 'e-priya',
      name: 'Priya & Arjun wedding',
      clientName: 'Priya',
      clientPhone: '+91 98765 43210',
      status: 'planning',
      functions: [
        fn('f-mehendi', 't-mehendi', 'Mehendi', '2099-02-12', { venueName: 'Leela Palace' }),
        fn('f-sangeet', 't-sangeet', 'Sangeet', '2099-02-12', {
          startTime: '18:30',
          endTime: '01:00',
          guestCount: 400,
        }),
        fn('f-muhurtham', 't-muhurtham', 'Muhurtham / Wedding', '2099-02-14', {
          startTime: '06:00',
          guestCount: 1200,
        }),
      ],
    },
    {
      ...base,
      id: 'e-kavya',
      name: 'Kavya & Rohan wedding',
      clientName: 'Kavya',
      clientPhone: '+91 90000 11111',
      status: 'created',
      functions: [],
    },
    {
      ...base,
      id: 'e-meera',
      name: 'Meera & Karthik wedding',
      clientName: 'Meera',
      clientPhone: '+91 90000 22222',
      status: 'completed',
      functions: [fn('f-old', null, 'Reception', '2024-01-10')],
    },
  ];
}

export function createEventsServer() {
  const calls: Recorded[] = [];
  const events = seed();
  const find = (id: string | readonly string[] | undefined) =>
    events.find((event) => event.id === id);
  const record = async (request: Request) => {
    const url = new URL(request.url);
    const body: unknown =
      request.method === 'GET' || request.method === 'DELETE'
        ? undefined
        : await request.clone().json();
    calls.push({ method: request.method, path: url.pathname.replace('/api/v1', ''), body });
    return body;
  };
  const dates = (event: EventRecord) => event.functions.map((row) => row.date).sort();
  const summary = (event: EventRecord) => ({
    id: event.id,
    name: event.name,
    clientName: event.clientName,
    status: event.status,
    formSubmittedAt: event.formSubmittedAt,
    createdAt: event.createdAt,
    firstFunctionDate: dates(event).at(0) ?? null,
    lastFunctionDate: dates(event).at(-1) ?? null,
    functionCount: event.functions.length,
  });
  const detail = (event: EventRecord) => ({
    ...summary(event),
    clientPhone: event.clientPhone,
    clientEmail: event.clientEmail,
    overallBudget: event.overallBudget,
    formToken: event.formToken,
    formLocked: event.formLocked,
    requestedServices: [],
    functions: event.functions.map((row, index) => ({ ...row, sortOrder: index })),
    plan: { services: 0, planned: 0 },
  });
  const notFound = () =>
    HttpResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Event not found' } },
      { status: 404 },
    );
  const named = (input: FunctionInput) =>
    input.functionTypeId
      ? (TYPES.find((type) => type.id === input.functionTypeId)?.name ?? '?')
      : (input.customName ?? '');
  const fromInput = (id: string, input: FunctionInput): EventFunction => ({
    id,
    functionTypeId: input.functionTypeId,
    customName: input.customName,
    name: named(input),
    functionTypeArchived: false,
    date: input.date,
    startTime: input.startTime,
    endTime: input.endTime,
    venueName: input.venueName || null,
    venueAddress: input.venueAddress || null,
    guestCount: input.guestCount,
    sortOrder: 0,
  });
  let nextId = 1;

  const handlers = [
    http.get(`${API}/function-types`, () => HttpResponse.json({ data: TYPES })),
    http.get(`${API}/events`, ({ request }) => {
      const view = new URL(request.url).searchParams.get('view');
      const isPast = (event: EventRecord) =>
        event.status === 'completed' ||
        event.status === 'cancelled' ||
        (dates(event).at(-1) ?? '9999') < today();
      const rows = events.filter((event) => (view === 'past' ? isPast(event) : !isPast(event)));
      return HttpResponse.json({ data: rows.map(summary), nextCursor: null });
    }),
    http.get(`${API}/events/:id`, ({ params }) => {
      const event = find(params.id);
      return event ? HttpResponse.json({ data: detail(event) }) : notFound();
    }),
    http.patch(`${API}/events/:id`, async ({ request, params }) => {
      const body = (await record(request)) as Partial<EventRecord>;
      const event = find(params.id);
      if (!event) return notFound();
      Object.assign(event, body, body.clientEmail === '' ? { clientEmail: null } : {});
      return HttpResponse.json({ data: detail(event) });
    }),
    http.patch(`${API}/events/:id/status`, async ({ request, params }) => {
      const body = (await record(request)) as { status: EventStatus };
      const event = find(params.id);
      if (!event) return notFound();
      event.status = body.status;
      return HttpResponse.json({ data: detail(event) });
    }),
    http.post(`${API}/events/:id/functions`, async ({ request, params }) => {
      const input = (await record(request)) as FunctionInput;
      const event = find(params.id);
      if (!event) return notFound();
      const created = fromInput(`f-new-${nextId++}`, input);
      event.functions.push(created);
      if (event.status === 'created' || event.status === 'requested') event.status = 'planning';
      return HttpResponse.json({ data: created }, { status: 201 });
    }),
    http.put(`${API}/events/:id/functions/order`, async ({ request, params }) => {
      const { ids } = (await record(request)) as { ids: string[] };
      const event = find(params.id);
      if (!event) return notFound();
      event.functions.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
      return new HttpResponse(null, { status: 204 });
    }),
    http.patch(`${API}/events/:id/functions/:fid`, async ({ request, params }) => {
      const input = (await record(request)) as FunctionInput;
      const event = find(params.id);
      const index = event?.functions.findIndex((row) => row.id === params.fid) ?? -1;
      if (!event || index === -1) return notFound();
      const updated = fromInput(String(params.fid), input);
      event.functions[index] = updated;
      return HttpResponse.json({
        data: { function: updated, effects: { paxRowsUpdated: 0, tasksMoved: 0 } },
      });
    }),
    http.get(`${API}/events/:id/functions/:fid/impact`, () =>
      HttpResponse.json({ data: { functionRows: 0, tasks: 0, emptiedLines: [] } }),
    ),
    http.delete(`${API}/events/:id/functions/:fid`, async ({ request, params }) => {
      await record(request);
      const event = find(params.id);
      if (!event) return notFound();
      event.functions = event.functions.filter((row) => row.id !== params.fid);
      return new HttpResponse(null, { status: 204 });
    }),
  ];

  return { handlers, calls };
}

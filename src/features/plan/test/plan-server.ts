import { http, HttpResponse } from 'msw';
import { fakeSummary } from '@/features/summary/test/fake-summary';
import type { Task } from '@/features/tasks';
import { createTasksBackend } from '@/features/tasks/test/tasks-server';
import type { LineInput, ServiceLine } from '../api/plan.schema';

// An in-memory backend for S6/S7/S8 (event, catalogue, plan, vendor options): reads reflect writes.

export const API = 'http://api.test/api/v1';
export type Recorded = { method: string; path: string; body: unknown };

const svc = (
  id: string,
  categoryId: string,
  name: string,
  effectiveParameters: string[],
  sortOrder: number,
) => ({
  id,
  categoryId,
  name,
  description: null,
  showOnClientForm: true,
  hasRooms: false,
  parametersOverride: null,
  effectiveParameters,
  sortOrder,
  archivedAt: null,
});

const CATALOGUE = {
  canReset: false,
  categories: [
    {
      id: 'c-food',
      name: 'Food and Beverage',
      sortOrder: 0,
      parameters: ['pax'],
      paxPrefill: true,
      sizeLabels: [],
      archivedAt: null,
      services: [svc('s-catering', 'c-food', 'Catering', ['pax'], 0)],
    },
    {
      id: 'c-decor',
      name: 'Decor',
      sortOrder: 1,
      parameters: ['size'],
      paxPrefill: false,
      sizeLabels: ['Stage', 'Hall'],
      archivedAt: null,
      services: [svc('s-stage', 'c-decor', 'Stage Decor', ['size'], 0)],
    },
    {
      id: 'c-photo',
      name: 'Photography and Videography',
      sortOrder: 2,
      parameters: ['pax', 'hours'],
      paxPrefill: false,
      sizeLabels: [],
      archivedAt: null,
      services: [svc('s-candid', 'c-photo', 'Candid Photography', ['pax', 'hours'], 0)],
    },
    {
      id: 'c-ent',
      name: 'Entertainment',
      sortOrder: 3,
      parameters: ['hours'],
      paxPrefill: false,
      sizeLabels: [],
      archivedAt: null,
      services: [
        svc('s-dj', 'c-ent', 'DJ / VDJ', ['hours'], 0),
        svc('s-singers', 'c-ent', 'Singers / Performers', ['hours'], 1),
      ],
    },
  ],
};

const VENDOR_NAMES: Record<string, string> = {
  'v-anna': 'Annapoorna Caterers',
  'v-saravana': 'Saravana Caterers',
  'v-lens': 'Lens & Light',
  'v-beat': 'Beat Republic',
  'v-sruthi': 'Sruthi Laya Band',
};

type VendorOptionRecord = {
  id: string;
  name: string;
  city: string | null;
  rateAmount: number | null;
  rateBasis: string | null;
  rateNote: string | null;
};
const OPTIONS: Record<
  string,
  {
    id: string;
    name: string;
    city: string | null;
    rateAmount: number | null;
    rateBasis: string | null;
    rateNote: string | null;
  }[]
> = {
  's-dj': [
    {
      id: 'v-beat',
      name: 'Beat Republic',
      city: 'Chennai',
      rateAmount: 8000,
      rateBasis: 'hours',
      rateNote: null,
    },
    {
      id: 'v-sruthi',
      name: 'Sruthi Laya Band',
      city: null,
      rateAmount: null,
      rateBasis: null,
      rateNote: null,
    },
  ],
  's-catering': [
    {
      id: 'v-anna',
      name: 'Annapoorna Caterers',
      city: null,
      rateAmount: 500,
      rateBasis: 'pax',
      rateNote: null,
    },
    {
      id: 'v-saravana',
      name: 'Saravana Caterers',
      city: null,
      rateAmount: null,
      rateBasis: null,
      rateNote: null,
    },
  ],
};

/** Opt-in (`rooms: true`): a Venue and Accommodation band whose Accommodation opens S14. */
const ROOMS_CATEGORY = {
  id: 'c-venue',
  name: 'Venue and Accommodation',
  sortOrder: 4,
  parameters: ['pax'],
  paxPrefill: true,
  sizeLabels: [],
  archivedAt: null,
  services: [{ ...svc('s-accommodation', 'c-venue', 'Accommodation', ['pax'], 0), hasRooms: true }],
};

function accommodationLine(): ServiceLine {
  return {
    id: 'l-accommodation',
    serviceId: 's-accommodation',
    serviceName: 'Accommodation',
    categoryId: 'c-venue',
    serviceArchived: false,
    serviceHasRooms: true,
    defaultVendorId: null,
    defaultVendor: null,
    perFunctionVendor: false,
    lineBudget: 2_40_000,
    notes: null,
    rows: [],
  };
}

type VendorRefOf = (id: string | null) => ServiceLine['defaultVendor'];

function seedLines(vendorRef: VendorRefOf): ServiceLine[] {
  return [
    {
      id: 'l-catering',
      serviceId: 's-catering',
      serviceName: 'Catering',
      categoryId: 'c-food',
      serviceArchived: false,
      serviceHasRooms: false,
      defaultVendorId: 'v-anna',
      defaultVendor: vendorRef('v-anna'),
      perFunctionVendor: true,
      lineBudget: null,
      notes: null,
      rows: [
        {
          id: 'r1',
          eventFunctionId: 'f-mehendi',
          vendorId: null,
          vendor: null,
          quantities: { pax: 150 },
          paxEdited: false,
          budget: 75_000,
        },
        {
          id: 'r2',
          eventFunctionId: 'f-reception',
          vendorId: 'v-saravana',
          vendor: vendorRef('v-saravana'),
          quantities: { pax: 1000 },
          paxEdited: true,
          budget: 5_00_000,
        },
      ],
    },
    {
      id: 'l-candid',
      serviceId: 's-candid',
      serviceName: 'Candid Photography',
      categoryId: 'c-photo',
      serviceArchived: false,
      serviceHasRooms: false,
      defaultVendorId: 'v-lens',
      defaultVendor: vendorRef('v-lens'),
      perFunctionVendor: false,
      lineBudget: 1_80_000,
      notes: null,
      rows: [
        {
          id: 'r3',
          eventFunctionId: 'f-sangeet',
          vendorId: null,
          vendor: null,
          quantities: { hours: 5 },
          paxEdited: false,
          budget: null,
        },
        {
          id: 'r4',
          eventFunctionId: 'f-reception',
          vendorId: null,
          vendor: null,
          quantities: { hours: 4 },
          paxEdited: false,
          budget: null,
        },
      ],
    },
  ];
}

const fn = (id: string, name: string, date: string, guestCount: number, sortOrder: number) => ({
  id,
  functionTypeId: null,
  customName: name,
  name,
  functionTypeArchived: false,
  date,
  startTime: '18:30',
  endTime: null,
  venueName: null,
  venueAddress: null,
  guestCount,
  sortOrder,
});

const seedTask = (id: string, extra: Partial<Task>): Task => ({
  id,
  eventId: 'e1',
  eventFunctionId: null,
  functionName: null,
  serviceLineId: null,
  serviceName: null,
  vendor: null,
  title: id,
  dueDate: '2099-02-01',
  dueTime: null,
  remindBeforeMin: 15,
  status: 'pending',
  issueNote: null,
  completedAt: null,
  kind: 'pre_event',
  ...extra,
});

/** Two tasks: a pre-event one on Catering, and Reception's photographer call time. */
export const SEED_TASKS: Task[] = [
  seedTask('t-tasting', {
    title: 'Confirm menu tasting',
    serviceLineId: 'l-catering',
    serviceName: 'Catering',
    vendor: { id: 'v-anna', name: 'Annapoorna Caterers', phone: '+91 98400 11111' },
  }),
  seedTask('t-photo', {
    title: 'Photographer arrives',
    eventFunctionId: 'f-reception',
    functionName: 'Reception',
    dueDate: '2099-02-14',
    dueTime: '17:00',
    kind: 'day_of',
    serviceLineId: 'l-candid',
    serviceName: 'Candid Photography',
    vendor: { id: 'v-lens', name: 'Lens & Light', phone: '+91 98400 22222' },
  }),
];

export function createPlanServer(
  options_: { noFunctions?: boolean; tasks?: Task[]; rooms?: boolean } = {},
) {
  const catalogue = options_.rooms
    ? { ...CATALOGUE, categories: [...CATALOGUE.categories, ROOMS_CATEGORY] }
    : CATALOGUE;
  const calls: Recorded[] = [];
  const vendorNames = { ...VENDOR_NAMES };
  const options: Record<string, VendorOptionRecord[]> = structuredClone(OPTIONS);
  const vendorRef: VendorRefOf = (id) =>
    id ? { name: vendorNames[id] ?? id, archived: false, offersService: true } : null;
  let lines = options_.rooms
    ? [...seedLines(vendorRef), accommodationLine()]
    : seedLines(vendorRef);
  const envelopes = new Map<string, number>([['c-food', 5_00_000]]);
  const functions = options_.noFunctions
    ? []
    : [
        fn('f-mehendi', 'Mehendi', '2099-02-12', 150, 0),
        fn('f-sangeet', 'Sangeet', '2099-02-12', 400, 1),
        fn('f-reception', 'Reception', '2099-02-14', 1200, 2),
      ];
  const taskBackend = createTasksBackend({
    functions: () => functions,
    lines: () =>
      lines.map((line) => ({
        id: line.id,
        serviceName: line.serviceName,
        vendor:
          line.defaultVendorId && line.defaultVendor
            ? { id: line.defaultVendorId, name: line.defaultVendor.name, phone: '+91 98400 33333' }
            : null,
      })),
    seed: options_.tasks ?? (options_.noFunctions ? [] : SEED_TASKS),
  });
  let nextId = 1;
  const record = async (request: Request) => {
    const body: unknown = ['GET', 'DELETE'].includes(request.method)
      ? undefined
      : await request.clone().json();
    calls.push({
      method: request.method,
      path: new URL(request.url).pathname.replace('/api/v1', ''),
      body,
    });
    return body;
  };
  const serviceName = (id: string) =>
    catalogue.categories.flatMap((c) => c.services).find((s) => s.id === id);
  const toLine = (id: string, serviceId: string, input: LineInput): ServiceLine => ({
    id,
    serviceId,
    serviceName: serviceName(serviceId)?.name ?? '?',
    categoryId: serviceName(serviceId)?.categoryId ?? '?',
    serviceArchived: false,
    serviceHasRooms: serviceName(serviceId)?.hasRooms ?? false,
    defaultVendorId: input.defaultVendorId,
    defaultVendor: vendorRef(input.defaultVendorId),
    perFunctionVendor: input.perFunctionVendor,
    lineBudget: input.lineBudget,
    notes: input.notes || null,
    rows: input.rows.map((row, i) => ({
      id: `${id}-r${i}`,
      ...row,
      vendor: vendorRef(row.vendorId),
      paxEdited: false,
    })),
  });

  const handlers = [
    http.get(`${API}/events/:id`, () =>
      HttpResponse.json({
        data: {
          id: 'e1',
          name: 'Priya & Arjun wedding',
          clientName: 'Priya',
          status: 'planning',
          formSubmittedAt: null,
          createdAt: '2026-11-20T10:00:00.000Z',
          firstFunctionDate: functions.length ? '2099-02-12' : null,
          lastFunctionDate: functions.length ? '2099-02-14' : null,
          functionCount: functions.length,
          clientPhone: '+91 98765 43210',
          clientEmail: null,
          overallBudget: 25_00_000,
          formToken: 'x'.repeat(43),
          formLocked: false,
          requestedServices: [
            {
              serviceId: 's-dj',
              serviceName: 'DJ / VDJ',
              categoryName: 'Entertainment',
              clientNote: null,
              planned: lines.some((l) => l.serviceId === 's-dj'),
            },
            {
              serviceId: 's-catering',
              serviceName: 'Catering',
              categoryName: 'Food and Beverage',
              clientNote: null,
              planned: lines.some((l) => l.serviceId === 's-catering'),
            },
          ],
          functions,
          openTasks: taskBackend.openCount(),
        },
      }),
    ),
    http.get(`${API}/catalogue`, () => HttpResponse.json({ data: catalogue })),
    http.get(`${API}/events/:id/summary`, () =>
      HttpResponse.json({
        data: fakeSummary({
          overallBudget: 25_00_000,
          functions,
          categories: catalogue.categories,
          lines,
          envelopes,
        }),
      }),
    ),
    http.get(`${API}/events/:id/service-lines`, () =>
      HttpResponse.json({
        data: {
          lines,
          envelopes: [...envelopes].map(([categoryId, amount]) => ({ categoryId, amount })),
        },
      }),
    ),
    http.get(`${API}/vendors/offering/:serviceId`, ({ params }) =>
      HttpResponse.json({ data: options[String(params.serviceId)] ?? [] }),
    ),
    http.post(`${API}/events/:id/service-lines`, async ({ request }) => {
      const body = (await record(request)) as LineInput & { serviceId: string };
      const existing = lines.find((l) => l.serviceId === body.serviceId);
      if (existing) {
        return HttpResponse.json(
          {
            error: {
              code: 'CONFLICT',
              message: 'This service is already planned for this event.',
              details: { lineId: existing.id },
            },
          },
          { status: 409 },
        );
      }
      const line = toLine(`l-new-${nextId++}`, body.serviceId, body);
      lines = [...lines, line];
      return HttpResponse.json({ data: line }, { status: 201 });
    }),
    http.put(`${API}/events/:id/service-lines/:lineId`, async ({ request, params }) => {
      const body = (await record(request)) as LineInput;
      const current = lines.find((l) => l.id === params.lineId);
      if (!current)
        return HttpResponse.json(
          { error: { code: 'NOT_FOUND', message: 'Service line not found' } },
          { status: 404 },
        );
      const line = toLine(current.id, current.serviceId, body);
      lines = lines.map((l) => (l.id === current.id ? line : l));
      return HttpResponse.json({ data: line });
    }),
    http.delete(`${API}/events/:id/service-lines/:lineId`, async ({ request, params }) => {
      await record(request);
      lines = lines.filter((l) => l.id !== params.lineId);
      taskBackend.unlinkLine(String(params.lineId));
      return new HttpResponse(null, { status: 204 });
    }),
    http.put(`${API}/events/:id/envelopes/:categoryId`, async ({ request, params }) => {
      const { amount } = (await record(request)) as { amount: number | null };
      const categoryId = String(params.categoryId);
      if (amount === null) envelopes.delete(categoryId);
      else envelopes.set(categoryId, amount);
      return HttpResponse.json({ data: { categoryId, amount } });
    }),
    http.post(`${API}/vendors`, async ({ request }) => {
      const body = (await record(request)) as {
        name: string;
        phone: string;
        services: { serviceId: string }[];
      };
      const id = `v-new-${nextId++}`;
      vendorNames[id] = body.name;
      for (const link of body.services) {
        (options[link.serviceId] ??= []).push({
          id,
          name: body.name,
          city: null,
          rateAmount: null,
          rateBasis: null,
          rateNote: null,
        });
      }
      return HttpResponse.json(
        {
          data: {
            id,
            name: body.name,
            contactPerson: null,
            phone: body.phone,
            altPhone: null,
            city: null,
            address: null,
            portfolioUrl: null,
            notes: null,
            archivedAt: null,
            contacts: [],
            services: [],
            categories: [],
            usedInEvents: 0,
            canDelete: true,
          },
        },
        { status: 201 },
      );
    }),
  ];
  return { handlers: [...handlers, ...taskBackend.handlers], calls, tasks: taskBackend };
}

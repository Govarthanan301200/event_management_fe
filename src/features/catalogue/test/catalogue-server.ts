import { http, HttpResponse } from 'msw';
import type { ParameterKey } from '../api/catalogue.schema';

// An in-memory S2 backend for MSW: GET reflects every write, like the real API.

export const API = 'http://api.test/api/v1';

type ServiceRecord = {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  showOnClientForm: boolean;
  hasRooms: boolean;
  parametersOverride: ParameterKey[] | null;
  sortOrder: number;
  archivedAt: string | null;
};
type CategoryRecord = {
  id: string;
  name: string;
  sortOrder: number;
  parameters: ParameterKey[];
  paxPrefill: boolean;
  sizeLabels: string[];
  archivedAt: string | null;
};

export type Recorded = { method: string; path: string; body: unknown };

const ARCHIVED = '2026-11-20T10:00:00.000Z';

export function createCatalogueServer(options: { canReset?: boolean } = {}) {
  const calls: Recorded[] = [];
  const categories: CategoryRecord[] = [
    {
      id: 'c-photo',
      name: 'Photography and Videography',
      sortOrder: 0,
      parameters: ['pax', 'hours'],
      paxPrefill: false,
      sizeLabels: [],
      archivedAt: null,
    },
    {
      id: 'c-decor',
      name: 'Decor',
      sortOrder: 1,
      parameters: ['size'],
      paxPrefill: false,
      sizeLabels: ['Stage', 'Hall', 'Lawn'],
      archivedAt: null,
    },
    {
      id: 'c-legal',
      name: 'Legal and Compliance',
      sortOrder: 2,
      parameters: ['pax'],
      paxPrefill: false,
      sizeLabels: [],
      archivedAt: ARCHIVED,
    },
  ];
  const services: ServiceRecord[] = [
    {
      id: 's-candid',
      categoryId: 'c-photo',
      name: 'Candid Photography',
      description: 'Natural, unposed moments',
      showOnClientForm: true,
      hasRooms: false,
      parametersOverride: null,
      sortOrder: 0,
      archivedAt: null,
    },
    {
      id: 's-drone',
      categoryId: 'c-photo',
      name: 'Drone Coverage',
      description: 'Aerial shots',
      showOnClientForm: true,
      hasRooms: false,
      parametersOverride: ['hours'],
      sortOrder: 1,
      archivedAt: null,
    },
    {
      id: 's-albums',
      categoryId: 'c-photo',
      name: 'Albums / Calendar / Photoframe',
      description: null,
      showOnClientForm: false,
      hasRooms: false,
      parametersOverride: ['work'],
      sortOrder: 2,
      archivedAt: null,
    },
    {
      id: 's-booth',
      categoryId: 'c-photo',
      name: 'Photo Booth',
      description: null,
      showOnClientForm: true,
      hasRooms: false,
      parametersOverride: null,
      sortOrder: 3,
      archivedAt: ARCHIVED,
    },
    {
      id: 's-stage',
      categoryId: 'c-decor',
      name: 'Stage Decor',
      description: null,
      showOnClientForm: true,
      hasRooms: false,
      parametersOverride: null,
      sortOrder: 0,
      archivedAt: null,
    },
  ];

  const serviceDto = (service: ServiceRecord) => {
    const category = categories.find((item) => item.id === service.categoryId);
    return {
      ...service,
      effectiveParameters: service.parametersOverride ?? category?.parameters ?? [],
    };
  };
  const tree = () => ({
    categories: [...categories]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((category) => ({
        ...category,
        services: services
          .filter((service) => service.categoryId === category.id)
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map(serviceDto),
      })),
    canReset: options.canReset ?? true,
  });
  const record = async (request: Request) => {
    const text = await request.text();
    calls.push({
      method: request.method,
      path: new URL(request.url).pathname.replace('/api/v1', ''),
      body: text ? (JSON.parse(text) as unknown) : undefined,
    });
    return calls.at(-1)?.body as Record<string, unknown> | undefined;
  };
  const archive = (value: unknown, current: string | null) =>
    value === undefined ? current : value ? (current ?? new Date().toISOString()) : null;

  const handlers = [
    http.get(`${API}/catalogue`, () => HttpResponse.json({ data: tree() })),
    http.patch(`${API}/catalogue/services/:id`, async ({ request, params }) => {
      const body = (await record(request)) ?? {};
      const service = services.find((item) => item.id === params.id);
      if (!service)
        return HttpResponse.json(
          { error: { code: 'NOT_FOUND', message: 'Service not found' } },
          { status: 404 },
        );
      Object.assign(service, {
        ...('showOnClientForm' in body ? { showOnClientForm: body.showOnClientForm } : {}),
        ...('hasRooms' in body ? { hasRooms: body.hasRooms } : {}),
        ...('name' in body ? { name: body.name } : {}),
        archivedAt: archive(body.archived, service.archivedAt),
      });
      return HttpResponse.json({ data: serviceDto(service) });
    }),
    http.patch(`${API}/catalogue/categories/:id`, async ({ request, params }) => {
      const body = (await record(request)) ?? {};
      const category = categories.find((item) => item.id === params.id);
      if (!category)
        return HttpResponse.json(
          { error: { code: 'NOT_FOUND', message: 'Category not found' } },
          { status: 404 },
        );
      if (
        typeof body.name === 'string' &&
        categories.some(
          (c) => c.id !== category.id && c.name.toLowerCase() === String(body.name).toLowerCase(),
        )
      ) {
        return HttpResponse.json(
          {
            error: { code: 'CONFLICT', message: `A category named "${body.name}" already exists.` },
          },
          { status: 409 },
        );
      }
      Object.assign(category, {
        ...('name' in body ? { name: body.name } : {}),
        ...('parameters' in body ? { parameters: body.parameters } : {}),
        ...('paxPrefill' in body ? { paxPrefill: body.paxPrefill } : {}),
        archivedAt: archive(body.archived, category.archivedAt),
      });
      return HttpResponse.json({ data: category });
    }),
    http.post(`${API}/catalogue/categories/:id/services`, async ({ request, params }) => {
      const body = (await record(request)) as Omit<
        ServiceRecord,
        'id' | 'categoryId' | 'sortOrder' | 'archivedAt'
      >;
      const service: ServiceRecord = {
        ...body,
        description: body.description === '' ? null : body.description,
        id: `s-new-${services.length}`,
        categoryId: String(params.id),
        sortOrder: services.length,
        archivedAt: null,
      };
      services.push(service);
      return HttpResponse.json({ data: serviceDto(service) }, { status: 201 });
    }),
    http.put(`${API}/catalogue/categories/:id/services/order`, async ({ request }) => {
      const body = (await record(request)) as { ids: string[] };
      body.ids.forEach((id, index) => {
        const service = services.find((item) => item.id === id);
        if (service) service.sortOrder = index;
      });
      return new HttpResponse(null, { status: 204 });
    }),
    http.post(`${API}/catalogue/reset`, async ({ request }) => {
      await record(request);
      return HttpResponse.json({ data: tree() });
    }),
  ];

  return { handlers, calls };
}

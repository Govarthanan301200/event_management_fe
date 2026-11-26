import { http, HttpResponse } from 'msw';
import type { RateBasis } from '../api/vendors.schema';

// An in-memory vendors backend (plus the catalogue it links to) for MSW: reads reflect writes.

export const API = 'http://api.test/api/v1';
const ARCHIVED = '2026-11-20T10:00:00.000Z';

type ServiceRecord = { id: string; name: string; archivedAt: string | null };
type CategoryRecord = {
  id: string;
  name: string;
  archivedAt: string | null;
  services: ServiceRecord[];
};
type LinkRecord = {
  serviceId: string;
  rateAmount: number | null;
  rateBasis: RateBasis | null;
  rateNote: string | null;
};
type VendorRecord = {
  id: string;
  name: string;
  contactPerson: string | null;
  phone: string;
  altPhone: string | null;
  city: string | null;
  address: string | null;
  portfolioUrl: string | null;
  notes: string | null;
  archivedAt: string | null;
  contacts: { id: string; name: string; role: string | null; phone: string }[];
  services: LinkRecord[];
};

export type Recorded = { method: string; path: string; body: unknown };

const catalogue: CategoryRecord[] = [
  {
    id: 'c-ent',
    name: 'Entertainment',
    archivedAt: null,
    services: [
      { id: 's-dj', name: 'DJ / VDJ', archivedAt: null },
      { id: 's-singers', name: 'Singers / Performers', archivedAt: null },
      { id: 's-emcee', name: 'Emcee / Host', archivedAt: null },
      { id: 's-nada', name: 'Nadaswaram', archivedAt: null },
    ],
  },
  {
    id: 'c-photo',
    name: 'Photography and Videography',
    archivedAt: null,
    services: [{ id: 's-candid', name: 'Candid Photography', archivedAt: null }],
  },
  {
    id: 'c-tech',
    name: 'Technicals and Special Effects',
    archivedAt: null,
    services: [{ id: 's-sound', name: 'Sound System', archivedAt: ARCHIVED }],
  },
];

const link = (serviceId: string, rate?: Partial<LinkRecord>): LinkRecord => ({
  serviceId,
  rateAmount: null,
  rateBasis: null,
  rateNote: null,
  ...rate,
});

function seedVendors(): VendorRecord[] {
  const base = {
    altPhone: null,
    address: null,
    portfolioUrl: null,
    notes: null,
    archivedAt: null,
    contacts: [],
  };
  return [
    {
      ...base,
      id: 'v-beat',
      name: 'Beat Republic',
      contactPerson: 'Arjun S',
      phone: '+91 98400 12345',
      city: 'Chennai',
      portfolioUrl: 'https://instagram.com/beatrepublic',
      notes: 'Reliable, brings own sound.',
      contacts: [{ id: 'k-1', name: 'Karthik', role: 'Sound engineer', phone: '98410 00000' }],
      services: [
        link('s-dj', { rateAmount: 8000, rateBasis: 'hours', rateNote: 'Min 3 hrs' }),
        link('s-emcee', { rateAmount: 25000, rateBasis: 'package' }),
      ],
    },
    {
      ...base,
      id: 'v-sruthi',
      name: 'Sruthi Laya Band',
      contactPerson: 'Ravi Kumar',
      phone: '+91 97000 55555',
      city: 'Madurai',
      services: [link('s-singers'), link('s-candid')],
    },
    {
      ...base,
      id: 'v-old',
      name: 'Old Sound Co',
      contactPerson: null,
      phone: '044 2345 6789',
      city: null,
      archivedAt: ARCHIVED,
      services: [link('s-sound')],
    },
  ];
}

const digits = (text: string) => text.replace(/\D/g, '');

export function createVendorsServer(options: { empty?: boolean } = {}) {
  const calls: Recorded[] = [];
  let vendors: VendorRecord[] = options.empty ? [] : seedVendors();
  let nextId = 1;

  const findService = (serviceId: string) => {
    for (const category of catalogue) {
      const service = category.services.find((entry) => entry.id === serviceId);
      if (service) return { service, category };
    }
    return undefined;
  };
  const isActive = (serviceId: string) => {
    const found = findService(serviceId);
    return Boolean(found && !found.service.archivedAt && !found.category.archivedAt);
  };

  const detail = (vendor: VendorRecord) => {
    const services = vendor.services.flatMap((entry) => {
      const found = findService(entry.serviceId);
      if (!found) return [];
      return [
        {
          ...entry,
          serviceName: found.service.name,
          categoryId: found.category.id,
          categoryName: found.category.name,
          archived: !isActive(entry.serviceId),
        },
      ];
    });
    const categories = new Map<string, string>();
    for (const service of services)
      if (!service.archived) categories.set(service.categoryId, service.categoryName);
    return {
      ...vendor,
      services,
      categories: [...categories].map(([id, name]) => ({ id, name })),
      usedInEvents: 0,
      canDelete: true,
    };
  };

  const summary = (vendor: VendorRecord) => ({
    id: vendor.id,
    name: vendor.name,
    contactPerson: vendor.contactPerson,
    phone: vendor.phone,
    city: vendor.city,
    archivedAt: vendor.archivedAt,
    services: vendor.services
      .filter((entry) => isActive(entry.serviceId))
      .flatMap((entry) => {
        const found = findService(entry.serviceId);
        return found
          ? [{ id: found.service.id, name: found.service.name, categoryId: found.category.id }]
          : [];
      }),
  });

  const offersIn = (
    vendor: VendorRecord,
    test: (serviceId: string, categoryId: string) => boolean,
  ) =>
    vendor.services.some((entry) => {
      const found = findService(entry.serviceId);
      return Boolean(
        found && isActive(entry.serviceId) && test(entry.serviceId, found.category.id),
      );
    });

  const record = async (request: Request) => {
    const url = new URL(request.url);
    const body: unknown =
      request.method === 'GET' || request.method === 'DELETE' ? undefined : await request.json();
    calls.push({ method: request.method, path: url.pathname.replace('/api/v1', ''), body });
    return body;
  };

  type Body = Record<string, unknown> & {
    contacts?: { name: string; role: string; phone: string }[];
    services?: LinkRecord[];
    archived?: boolean;
  };
  const orNull = (value: unknown) =>
    typeof value === 'string' && value.trim() !== '' ? value.trim() : null;
  const applyBody = (vendor: VendorRecord, body: Body): VendorRecord => ({
    ...vendor,
    ...Object.fromEntries(
      (['name', 'phone'] as const)
        .filter((key) => key in body)
        .map((key) => [key, String(body[key])]),
    ),
    ...Object.fromEntries(
      (['contactPerson', 'altPhone', 'city', 'address', 'portfolioUrl', 'notes'] as const)
        .filter((key) => key in body)
        .map((key) => [key, orNull(body[key])]),
    ),
    ...(body.contacts
      ? {
          contacts: body.contacts.map((contact, index) => ({
            id: `k-new-${String(index)}`,
            name: contact.name,
            role: orNull(contact.role),
            phone: contact.phone,
          })),
        }
      : {}),
    ...(body.services
      ? { services: body.services.map((entry) => ({ ...entry, rateNote: orNull(entry.rateNote) })) }
      : {}),
    ...(body.archived === undefined ? {} : { archivedAt: body.archived ? ARCHIVED : null }),
  });

  const handlers = [
    http.get(`${API}/catalogue`, () =>
      HttpResponse.json({
        data: {
          canReset: vendors.length === 0,
          categories: catalogue.map((category, categoryIndex) => ({
            id: category.id,
            name: category.name,
            sortOrder: categoryIndex,
            parameters: ['hours'],
            paxPrefill: false,
            sizeLabels: [],
            archivedAt: category.archivedAt,
            services: category.services.map((service, serviceIndex) => ({
              id: service.id,
              categoryId: category.id,
              name: service.name,
              description: null,
              showOnClientForm: true,
              hasRooms: false,
              parametersOverride: null,
              effectiveParameters: ['hours'],
              sortOrder: serviceIndex,
              archivedAt: service.archivedAt,
            })),
          })),
        },
      }),
    ),
    http.get(`${API}/vendors/facets`, () => {
      const active = vendors.filter((vendor) => !vendor.archivedAt);
      const count = (test: (serviceId: string, categoryId: string) => boolean) =>
        active.filter((vendor) => offersIn(vendor, test)).length;
      return HttpResponse.json({
        data: {
          total: active.length,
          archived: vendors.length - active.length,
          categories: catalogue
            .map((category) => ({
              categoryId: category.id,
              count: count((_s, c) => c === category.id),
            }))
            .filter((entry) => entry.count > 0),
          services: catalogue
            .flatMap((category) => category.services)
            .map((service) => ({ serviceId: service.id, count: count((s) => s === service.id) }))
            .filter((entry) => entry.count > 0),
        },
      });
    }),
    http.get(`${API}/vendors`, async ({ request }) => {
      await record(request);
      const params = new URL(request.url).searchParams;
      const archived = params.get('archived') === 'true';
      const categoryId = params.get('categoryId');
      const serviceId = params.get('serviceId');
      const q = (params.get('q') ?? '').toLowerCase();
      const data = vendors
        .filter((vendor) => Boolean(vendor.archivedAt) === archived)
        .filter((vendor) => !categoryId || offersIn(vendor, (_s, c) => c === categoryId))
        .filter((vendor) => !serviceId || offersIn(vendor, (s) => s === serviceId))
        .filter(
          (vendor) =>
            !q ||
            vendor.name.toLowerCase().includes(q) ||
            (vendor.city ?? '').toLowerCase().includes(q) ||
            (digits(q).length >= 3 && digits(vendor.phone).includes(digits(q))),
        )
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(summary);
      return HttpResponse.json({ data, nextCursor: null });
    }),
    http.post(`${API}/vendors/phone-check`, async ({ request }) => {
      const body = (await record(request)) as { phone: string; exceptId?: string };
      const key = digits(body.phone).slice(-10);
      const data = vendors
        .filter((vendor) => vendor.id !== body.exceptId && digits(vendor.phone).slice(-10) === key)
        .map((vendor) => ({
          id: vendor.id,
          name: vendor.name,
          archived: Boolean(vendor.archivedAt),
        }));
      return HttpResponse.json({ data });
    }),
    http.post(`${API}/vendors`, async ({ request }) => {
      const body = (await record(request)) as Body;
      const blank: VendorRecord = {
        id: `v-new-${String(nextId++)}`,
        name: '',
        contactPerson: null,
        phone: '',
        altPhone: null,
        city: null,
        address: null,
        portfolioUrl: null,
        notes: null,
        archivedAt: null,
        contacts: [],
        services: [],
      };
      const vendor = applyBody(blank, body);
      vendors = [...vendors, vendor];
      return HttpResponse.json({ data: detail(vendor) }, { status: 201 });
    }),
    http.get(`${API}/vendors/:vendorId`, ({ params }) => {
      const vendor = vendors.find((entry) => entry.id === params.vendorId);
      if (!vendor) {
        return HttpResponse.json(
          { error: { code: 'NOT_FOUND', message: 'Vendor not found' } },
          { status: 404 },
        );
      }
      return HttpResponse.json({ data: detail(vendor) });
    }),
    http.patch(`${API}/vendors/:vendorId`, async ({ request, params }) => {
      const body = (await record(request)) as Body;
      const current = vendors.find((entry) => entry.id === params.vendorId);
      if (!current) {
        return HttpResponse.json(
          { error: { code: 'NOT_FOUND', message: 'Vendor not found' } },
          { status: 404 },
        );
      }
      const updated = applyBody(current, body);
      vendors = vendors.map((entry) => (entry.id === updated.id ? updated : entry));
      return HttpResponse.json({ data: detail(updated) });
    }),
    http.delete(`${API}/vendors/:vendorId`, async ({ request, params }) => {
      await record(request);
      vendors = vendors.filter((entry) => entry.id !== params.vendorId);
      return new HttpResponse(null, { status: 204 });
    }),
  ];

  return { handlers, calls, vendors: () => vendors };
}

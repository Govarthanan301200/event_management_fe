import { http, HttpResponse } from 'msw';
import type { GuestRow, GuestRowInput, Hotel, ImportRowInput } from '../api/rooms.schema';

// An in-memory S14 backend for MSW. It follows the server's rules (Backend rooms.rules.ts,
// unit-tested there): rows append in order; an import matches hotels by name ignoring case and
// adds unknown ones; `replace` clears the rows first; deleting a hotel clears it from its rows.

const API = 'http://api.test/api/v1/events/:eventId/rooms';

export type Recorded = { method: string; path: string; body: unknown; key: string | null };

const EMPTY: Omit<GuestRow, 'id' | 'name'> = {
  gId: null,
  srNo: null,
  cluster: null,
  groupId: null,
  contact: null,
  eventHotelId: null,
  roomNo: null,
  status: null,
  pax: null,
  rc: null,
  hamper: null,
  checkInDate: null,
  arrivalTime: null,
  departureDate: null,
};

export const guest = (id: string, extra: Partial<GuestRow> = {}): GuestRow => ({
  ...EMPTY,
  id,
  name: `Guest ${id}`,
  ...extra,
});

export const HOTEL_A: Hotel = { id: 'h-a', name: 'Hotel A', area: 'ECR', contact: '044 2345 6789' };
export const HOTEL_B: Hotel = { id: 'h-b', name: 'Hotel B', area: 'Guindy', contact: null };

/** Three guests: two share room 206 at Hotel A (spec §10 wireframe). */
export const SEED_ROWS: GuestRow[] = [
  guest('g1', {
    gId: 'G01',
    srNo: '1',
    cluster: 'C',
    groupId: 'AC',
    name: 'Lakshmi R',
    contact: '98400 12345',
    eventHotelId: 'h-a',
    roomNo: '206',
    status: 'checked_out',
    pax: 2,
    checkInDate: '2099-02-08',
    arrivalTime: '8th midnight',
    departureDate: '2099-02-10',
  }),
  guest('g2', { gId: 'G02', srNo: '1', name: 'Ravi R', eventHotelId: 'h-a', roomNo: '206' }),
  guest('g3', {
    gId: 'G03',
    srNo: '2',
    cluster: 'B',
    name: 'Meena K',
    eventHotelId: 'h-b',
    roomNo: '208',
    status: 'checked_in',
    pax: 3,
  }),
];

type Options = { hotels?: Hotel[]; rows?: GuestRow[]; failSave?: boolean };

export function createRoomsServer(options: Options = {}) {
  let hotels: Hotel[] = structuredClone(options.hotels ?? [HOTEL_A, HOTEL_B]);
  let rows: GuestRow[] = structuredClone(options.rows ?? SEED_ROWS);
  const calls: Recorded[] = [];
  let nextId = 1;
  const newId = (prefix: string) => `${prefix}-new-${String(nextId++)}`;

  const record = async (request: Request) => {
    const text = await request.text();
    const body: unknown = text ? JSON.parse(text) : undefined;
    calls.push({
      method: request.method,
      path: new URL(request.url).pathname.replace(/^\/api\/v1\/events\/[^/]+\/rooms/, ''),
      body,
      key: request.headers.get('Idempotency-Key'),
    });
    return body;
  };
  const fromInput = (input: GuestRowInput): GuestRow => ({ ...EMPTY, ...input, id: newId('g') });
  const hotelByName = (name: string) =>
    hotels.find((hotel) => hotel.name.trim().toLowerCase() === name.trim().toLowerCase());

  const handlers = [
    http.get(API, () => HttpResponse.json({ data: { hotels, rows } })),
    http.post(`${API}/rows`, async ({ request }) => {
      const body = (await record(request)) as { rows: GuestRowInput[] };
      const added = body.rows.map(fromInput);
      rows = [...rows, ...added];
      return HttpResponse.json({ data: added }, { status: 201 });
    }),
    http.patch(`${API}/rows/:rowId`, async ({ request, params }) => {
      const change = (await record(request)) as Partial<GuestRow>;
      if (options.failSave)
        return HttpResponse.json(
          { error: { code: 'INTERNAL', message: 'Boom', requestId: 'r' } },
          { status: 500 },
        );
      const row = rows.find((item) => item.id === params.rowId);
      if (!row)
        return HttpResponse.json(
          { error: { code: 'NOT_FOUND', message: 'Guest row not found' } },
          { status: 404 },
        );
      Object.assign(row, change);
      return HttpResponse.json({ data: row });
    }),
    http.post(`${API}/rows/delete`, async ({ request }) => {
      const { ids } = (await record(request)) as { ids: string[] };
      rows = rows.filter((row) => !ids.includes(row.id));
      return new HttpResponse(null, { status: 204 });
    }),
    http.post(`${API}/import`, async ({ request }) => {
      const body = (await record(request)) as { rows: ImportRowInput[]; replace: boolean };
      const hotelsAdded: string[] = [];
      for (const row of body.rows) {
        if (row.hotelName && !hotelByName(row.hotelName)) {
          hotels = [
            ...hotels,
            { id: newId('h'), name: row.hotelName.trim(), area: null, contact: null },
          ];
          hotelsAdded.push(row.hotelName.trim());
        }
      }
      if (body.replace) rows = [];
      rows = [
        ...rows,
        ...body.rows.map(({ hotelName, ...row }) =>
          fromInput({
            ...row,
            eventHotelId: hotelName ? (hotelByName(hotelName)?.id ?? null) : null,
          }),
        ),
      ];
      return HttpResponse.json(
        { data: { hotels, rows, added: body.rows.length, hotelsAdded } },
        { status: 201 },
      );
    }),
    http.post(`${API}/hotels`, async ({ request }) => {
      const body = (await record(request)) as Omit<Hotel, 'id'>;
      const clash = hotelByName(body.name);
      if (clash)
        return HttpResponse.json(
          {
            error: {
              code: 'CONFLICT',
              message: `${clash.name} is already in this event's hotel list.`,
            },
          },
          { status: 409 },
        );
      const hotel = { ...body, id: newId('h') };
      hotels = [...hotels, hotel];
      return HttpResponse.json({ data: hotel }, { status: 201 });
    }),
    http.patch(`${API}/hotels/:hotelId`, async ({ request, params }) => {
      const body = (await record(request)) as Omit<Hotel, 'id'>;
      const hotel = hotels.find((item) => item.id === params.hotelId);
      if (!hotel)
        return HttpResponse.json(
          { error: { code: 'NOT_FOUND', message: 'Hotel not found' } },
          { status: 404 },
        );
      Object.assign(hotel, body);
      return HttpResponse.json({ data: hotel });
    }),
    http.delete(`${API}/hotels/:hotelId`, async ({ request, params }) => {
      await record(request);
      hotels = hotels.filter((hotel) => hotel.id !== params.hotelId);
      rows = rows.map((row) =>
        row.eventHotelId === params.hotelId ? { ...row, eventHotelId: null } : row,
      );
      return new HttpResponse(null, { status: 204 });
    }),
  ];

  return {
    handlers,
    calls,
    get rows() {
      return rows;
    },
    get hotels() {
      return hotels;
    },
  };
}

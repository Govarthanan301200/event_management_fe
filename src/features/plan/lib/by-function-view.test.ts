import { describe, expect, it } from 'vitest';
import type { Catalogue } from '@/features/catalogue';
import type { EventMoneySummary } from '@/features/summary';
import type { ServiceLine } from '../api/plan.schema';
import { functionPlanView, pickFunction, todayIn } from './by-function-view';

const service = (id: string, categoryId: string, effectiveParameters: ('pax' | 'hours')[]) => ({
  id,
  categoryId,
  name: id,
  description: null,
  showOnClientForm: true,
  parametersOverride: null,
  effectiveParameters,
  sortOrder: 0,
  archivedAt: null,
});
const category = (id: string, services: ReturnType<typeof service>[]) => ({
  id,
  name: id,
  sortOrder: 0,
  parameters: ['pax' as const],
  paxPrefill: false,
  sizeLabels: [],
  archivedAt: null,
  services,
});
const catalogue: Catalogue = {
  canReset: false,
  categories: [
    category('food', [service('catering', 'food', ['pax'])]),
    category('ent', [service('dj', 'ent', ['hours']), service('band', 'ent', ['hours'])]),
    category('photo', [service('candid', 'photo', ['hours'])]),
  ],
};

const ref = (name: string) => ({ name, archived: false, offersService: true });
const row = (
  eventFunctionId: string,
  budget: number | null,
  quantities: object = {},
  vendorId: string | null = null,
) => ({
  id: `${eventFunctionId}-row`,
  eventFunctionId,
  vendorId,
  vendor: vendorId ? ref(vendorId) : null,
  quantities,
  paxEdited: false,
  budget,
});
const line = (
  id: string,
  categoryId: string,
  rows: ReturnType<typeof row>[],
  extra: Partial<ServiceLine> = {},
): ServiceLine => ({
  id,
  serviceId: id,
  serviceName: id,
  categoryId,
  serviceArchived: false,
  defaultVendorId: 'Annapoorna',
  defaultVendor: ref('Annapoorna'),
  perFunctionVendor: false,
  lineBudget: null,
  notes: null,
  rows,
  ...extra,
});

const plan = {
  envelopes: [],
  lines: [
    line('catering', 'food', [row('mehendi', 75_000, { pax: 150 }), row('sangeet', 2_00_000)]),
    line('dj', 'ent', [row('sangeet', null, { hours: 5 }, 'Beat Republic')], {
      perFunctionVendor: true,
      lineBudget: 40_000,
    }),
    line('band', 'ent', [row('sangeet', null), row('mehendi', null)]),
    line('candid', 'photo', [row('mehendi', null, { hours: 4 }), row('sangeet', null)], {
      lineBudget: 1_80_000,
      defaultVendorId: 'Lens',
      defaultVendor: ref('Lens Story'),
    }),
  ],
};

const rollup = (id: string, byFunction: Record<string, number>, shared = 0) => ({
  id,
  categoryId: '',
  total: shared + Object.values(byFunction).reduce((a, b) => a + b, 0),
  byFunction,
  shared,
});
const cat = (id: string, byFunction: Record<string, number>, shared = 0) => ({
  id,
  name: id === 'food' ? 'Food and Beverage' : id,
  byFunction,
  shared,
  planned: 0,
  envelope: null,
  left: null,
  over: false,
});
const summary: Pick<EventMoneySummary, 'categories' | 'lines'> = {
  categories: [
    cat('food', { mehendi: 75_000, sangeet: 2_00_000 }),
    cat('ent', { sangeet: 40_000 }),
    cat('photo', {}, 1_80_000),
  ],
  lines: [
    rollup('catering', { mehendi: 75_000, sangeet: 2_00_000 }),
    rollup('dj', { sangeet: 40_000 }),
    rollup('band', {}),
    rollup('candid', {}, 1_80_000),
  ],
};

describe('functionPlanView (S9)', () => {
  it('groups the services covering a function by category, with the server amounts', () => {
    const view = functionPlanView('sangeet', plan, summary, catalogue);
    expect(view.categories.map((c) => [c.name, c.amount, c.lines.map((l) => l.amount)])).toEqual([
      ['Food and Beverage', 2_00_000, [2_00_000]],
      ['ent', 40_000, [40_000, null]],
    ]);
  });

  it('shows the effective vendor and tags a per-function vendor as changed', () => {
    const [, ent] = functionPlanView('sangeet', plan, summary, catalogue).categories;
    expect(ent?.lines[0]).toMatchObject({
      serviceName: 'dj',
      vendor: 'Beat Republic',
      vendorChanged: true,
      quantities: '5 hrs',
    });
    expect(ent?.lines[1]).toMatchObject({ vendor: 'Annapoorna', vendorChanged: false });
  });

  it('puts Shared lines in their own group with the whole, unsplit total', () => {
    const view = functionPlanView('mehendi', plan, summary, catalogue);
    expect(view.shared).toEqual([
      expect.objectContaining({
        serviceName: 'candid',
        vendor: 'Lens Story',
        quantities: '4 hrs',
        total: 1_80_000,
        functionCount: 2,
      }),
    ]);
    expect(view.categories.flatMap((c) => c.lines.map((l) => l.serviceName))).not.toContain(
      'candid',
    );
  });

  it('leaves out categories and lines that do not cover the function', () => {
    const view = functionPlanView('reception', plan, summary, catalogue);
    expect(view).toEqual({ categories: [], shared: [] });
  });
});

describe('pickFunction', () => {
  const functions = [
    { id: 'mehendi', date: '2027-02-12' },
    { id: 'sangeet', date: '2027-02-13' },
    { id: 'reception', date: '2027-02-14' },
  ];
  it('opens the requested function', () => {
    expect(pickFunction(functions, 'reception', '2027-01-01')?.id).toBe('reception');
  });
  it('otherwise opens the next function from today', () => {
    expect(pickFunction(functions, null, '2027-02-13')?.id).toBe('sangeet');
    expect(pickFunction(functions, 'unknown', '2027-02-14')?.id).toBe('reception');
  });
  it('falls back to the first when all are past, and to nothing without functions', () => {
    expect(pickFunction(functions, null, '2027-03-01')?.id).toBe('mehendi');
    const none: typeof functions = [];
    expect(pickFunction(none, null, '2027-03-01')).toBeUndefined();
  });
});

describe('todayIn', () => {
  it('is the calendar date in the company time zone', () => {
    // 20:00 UTC on 14 Feb is already 15 Feb in India.
    expect(todayIn('Asia/Kolkata', new Date('2027-02-14T20:00:00Z'))).toBe('2027-02-15');
  });
});

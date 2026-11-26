import { describe, expect, it } from 'vitest';
import type { Catalogue } from '@/features/catalogue';
import { groupByCategory, serviceContext } from './plan-view';

const service = (id: string, categoryId: string, effectiveParameters: ('pax' | 'hours')[]) => ({
  id,
  categoryId,
  name: id,
  description: null,
  showOnClientForm: true,
  hasRooms: false,
  parametersOverride: null,
  effectiveParameters,
  sortOrder: 0,
  archivedAt: null,
});
const category = (id: string, extra: Partial<Catalogue['categories'][number]> = {}) => ({
  id,
  name: id,
  sortOrder: 0,
  parameters: ['pax' as const],
  paxPrefill: false,
  sizeLabels: [],
  archivedAt: null,
  services: [],
  ...extra,
});

const catalogue: Catalogue = {
  canReset: false,
  categories: [
    category('food', { paxPrefill: true, services: [service('catering', 'food', ['pax'])] }),
    category('old', { archivedAt: new Date(), services: [service('legacy', 'old', ['pax'])] }),
    category('gone', { archivedAt: new Date() }),
    category('ent', { services: [service('dj', 'ent', ['hours'])] }),
  ],
};
const line = (id: string, categoryId: string, lineBudget: number) => ({
  id,
  serviceId: id,
  serviceName: id,
  categoryId,
  serviceArchived: false,
  serviceHasRooms: false,
  defaultVendorId: null,
  defaultVendor: null,
  perFunctionVendor: false,
  lineBudget,
  notes: null,
  rows: [],
});

describe('groupByCategory', () => {
  it('keeps catalogue order, empty active categories, and archived ones only with lines', () => {
    const rollup = (id: string, planned: number, envelope: number | null) => ({
      id,
      name: id,
      byFunction: {},
      shared: planned,
      planned,
      envelope,
      left: envelope === null ? null : envelope - planned,
      over: envelope !== null && planned > envelope,
    });
    const bands = groupByCategory(
      catalogue,
      {
        lines: [line('catering', 'food', 500), line('legacy', 'old', 100)],
        envelopes: [{ categoryId: 'food', amount: 1000 }],
      },
      { categories: [rollup('food', 500, 1000), rollup('old', 100, null)] },
    );
    expect(
      bands.map((b) => [b.category.id, b.lines.length, b.planned, b.envelope, b.left]),
    ).toEqual([
      ['food', 1, 500, 1000, 500],
      ['old', 1, 100, null, null],
      ['ent', 0, 0, null, null],
    ]);
  });
});

describe('serviceContext', () => {
  it('pre-fills pax only when the category flag is on and the service has pax', () => {
    expect(serviceContext(catalogue, 'catering')).toMatchObject({
      paxPrefill: true,
      parameters: ['pax'],
    });
    expect(serviceContext(catalogue, 'dj')).toMatchObject({
      paxPrefill: false,
      parameters: ['hours'],
    });
    expect(serviceContext(catalogue, 'missing')).toBeNull();
  });
});

import { describe, expect, it } from 'vitest';
import type { VendorDetail } from '../api/vendors.schema';
import { vendorFormSchema } from '../api/vendors.schema';
import type { IndexedService } from './catalogue-index';
import {
  applyServiceSelection,
  emptyVendorForm,
  parseRupees,
  toFormValues,
  toVendorInput,
} from './vendor-form';
import { orderedTags, telHref, whatsAppHref } from './directory';

const indexed = (id: string, position: number, archived = false): [string, IndexedService] => [
  id,
  { id, name: id, categoryId: 'c', categoryName: 'C', position, archived },
];
const index = new Map([
  indexed('dj', 0),
  indexed('singers', 1),
  indexed('emcee', 2),
  indexed('old', 3, true),
]);
const row = (serviceId: string, rateAmount = '') => ({
  serviceId,
  rateAmount,
  rateBasis: '' as const,
  rateNote: '',
});

describe('applyServiceSelection', () => {
  it('keeps rates of still-selected services, adds new ones, drops unticked ones, in catalogue order', () => {
    const rows = [{ ...row('emcee', '25,000'), rateBasis: 'package' as const }, row('dj')];
    const next = applyServiceSelection(rows, new Set(['emcee', 'singers']), index);
    expect(next.map((r) => r.serviceId)).toEqual(['singers', 'emcee']);
    expect(next[1]).toMatchObject({ rateAmount: '25,000', rateBasis: 'package' });
  });

  it('never drops an archived link the picker cannot show', () => {
    const next = applyServiceSelection([row('old')], new Set(['dj']), index);
    expect(next.map((r) => r.serviceId)).toEqual(['dj', 'old']);
  });
});

describe('form ↔ API', () => {
  it('parses rupees with Indian grouping', () => {
    expect(parseRupees('1,80,000')).toBe(180_000);
    expect(parseRupees(' ')).toBeNull();
  });

  it('sends a rate only when an amount is entered', () => {
    const input = toVendorInput({
      ...emptyVendorForm(),
      name: 'Beat Republic',
      phone: '98400 12345',
      services: [
        { ...row('dj', '8,000'), rateBasis: 'hours', rateNote: 'Min 3 hrs' },
        row('emcee'),
      ],
    });
    expect(input.services).toEqual([
      { serviceId: 'dj', rateAmount: 8000, rateBasis: 'hours', rateNote: 'Min 3 hrs' },
      { serviceId: 'emcee', rateAmount: null, rateBasis: null, rateNote: '' },
    ]);
  });

  it('round-trips a saved vendor', () => {
    const vendor: VendorDetail = {
      id: 'v1',
      name: 'Beat Republic',
      contactPerson: null,
      phone: '98400 12345',
      altPhone: null,
      city: 'Chennai',
      address: null,
      portfolioUrl: null,
      notes: null,
      archivedAt: null,
      contacts: [{ id: 'k1', name: 'Arjun', role: null, phone: '98410 00000' }],
      services: [
        {
          serviceId: 'dj',
          serviceName: 'DJ',
          categoryId: 'c',
          categoryName: 'C',
          archived: false,
          rateAmount: 8000,
          rateBasis: 'hours',
          rateNote: null,
        },
      ],
      categories: [],
      canDelete: true,
    };
    const values = toFormValues(vendor);
    expect(values).toMatchObject({ contactPerson: '', city: 'Chennai', contacts: [{ role: '' }] });
    expect(values.services[0]).toEqual({
      serviceId: 'dj',
      rateAmount: '8000',
      rateBasis: 'hours',
      rateNote: '',
    });
    expect(vendorFormSchema.safeParse(values).success).toBe(true);
  });
});

describe('vendorFormSchema', () => {
  const valid = { ...emptyVendorForm('dj'), name: 'Beat Republic', phone: '+91 98400 12345' };

  it('needs only a name, a phone and one service (spec §9)', () => {
    expect(vendorFormSchema.safeParse(valid).success).toBe(true);
  });

  it('needs at least one service', () => {
    const result = vendorFormSchema.safeParse({ ...valid, services: [] });
    expect(result.error?.issues[0]?.message).toBe('Choose at least one service this vendor offers');
  });

  it('pairs a rate amount with its basis', () => {
    const noBasis = vendorFormSchema.safeParse({ ...valid, services: [row('dj', '8000')] });
    expect(noBasis.error?.issues[0]).toMatchObject({ message: 'Choose what the rate is per' });
    const noAmount = vendorFormSchema.safeParse({
      ...valid,
      services: [{ ...row('dj'), rateBasis: 'pax' }],
    });
    expect(noAmount.success).toBe(false);
  });

  it('rejects decimals and words in the amount', () => {
    for (const amount of ['80.5', 'eight', '-1']) {
      expect(
        vendorFormSchema.safeParse({
          ...valid,
          services: [{ ...row('dj', amount), rateBasis: 'pax' }],
        }).success,
      ).toBe(false);
    }
  });

  it('accepts only http(s) portfolio links', () => {
    expect(
      vendorFormSchema.safeParse({ ...valid, portfolioUrl: 'https://instagram.com/x' }).success,
    ).toBe(true);
    expect(
      vendorFormSchema.safeParse({ ...valid, portfolioUrl: 'javascript:alert(1)' }).success,
    ).toBe(false);
  });
});

describe('directory helpers', () => {
  it('puts tags from the browsed category first', () => {
    const tags = [
      { id: 'candid', name: 'Candid', categoryId: 'photo' },
      { id: 'dj', name: 'DJ', categoryId: 'ent' },
    ];
    expect(orderedTags(tags, 'ent').map((t) => t.id)).toEqual(['dj', 'candid']);
    expect(orderedTags(tags).map((t) => t.id)).toEqual(['candid', 'dj']);
  });

  it('builds call and WhatsApp links', () => {
    expect(telHref('+91 98400-12345')).toBe('tel:+919840012345');
    expect(whatsAppHref('98400 12345')).toBe('https://wa.me/919840012345');
    expect(whatsAppHref('+91 98400 12345')).toBe('https://wa.me/919840012345');
  });
});

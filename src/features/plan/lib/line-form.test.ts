import { describe, expect, it } from 'vitest';
import type { ServiceLine } from '../api/plan.schema';
import {
  fillFromSame,
  formTotal,
  lineFormSchema,
  paxState,
  toLineForm,
  toLineInput,
  untickWarnings,
  usesRowBudgets,
  type LineForm,
  type ServiceContext,
} from './line-form';

const functions = [
  { id: 'f-mehendi', name: 'Mehendi', guestCount: 150 },
  { id: 'f-sangeet', name: 'Sangeet', guestCount: 400 },
  { id: 'f-reception', name: 'Reception', guestCount: 1200 },
];
const catering: ServiceContext = { parameters: ['pax'], paxPrefill: true, sizeLabels: [] };
const dj: ServiceContext = { parameters: ['hours'], paxPrefill: false, sizeLabels: [] };
const stage: ServiceContext = {
  parameters: ['size'],
  paxPrefill: false,
  sizeLabels: ['Stage', 'Hall'],
};

const newForm = (service: ServiceContext, line?: ServiceLine) =>
  toLineForm({ categoryId: 'c', serviceId: 's', service, functions, line });

function rowOf(form: LineForm, id: string) {
  const row = form.rows[id];
  if (!row) throw new Error(`No row for ${id}`);
  return row;
}

const tick = (form: LineForm, ...ids: string[]): LineForm => ({ ...form, functionIds: ids });

const saved: ServiceLine = {
  id: 'l1',
  serviceId: 's-dj',
  serviceName: 'DJ / VDJ',
  categoryId: 'c-ent',
  serviceArchived: false,
  defaultVendorId: 'v1',
  defaultVendor: { name: 'Beat Republic', archived: false, offersService: true },
  perFunctionVendor: false,
  lineBudget: null,
  notes: 'Bring the dhol',
  rows: [
    {
      id: 'r1',
      eventFunctionId: 'f-sangeet',
      vendorId: null,
      vendor: null,
      quantities: { hours: 5 },
      paxEdited: false,
      budget: 40_000,
    },
    {
      id: 'r2',
      eventFunctionId: 'f-reception',
      vendorId: null,
      vendor: null,
      quantities: { hours: 4 },
      paxEdited: false,
      budget: 35_000,
    },
  ],
};

describe('toLineForm', () => {
  it('pre-fills pax from guests on a new line (core rule 5)', () => {
    const form = newForm(catering);
    expect(form.functionIds).toEqual([]);
    expect(form.rows['f-sangeet']?.pax).toBe('400');
    expect(newForm(dj).rows['f-sangeet']?.pax).toBe('');
  });

  it('loads a saved line, ticking only its functions', () => {
    const form = newForm(dj, saved);
    expect(form.functionIds).toEqual(['f-sangeet', 'f-reception']);
    expect(form.rows['f-sangeet']).toMatchObject({ hours: '5', budget: '40000' });
    expect(form.notes).toBe('Bring the dhol');
    expect(form.defaultVendorId).toBe('v1');
  });

  it('gives every row one measurement per size label', () => {
    expect(newForm(stage).rows['f-mehendi']?.size.map((m) => m.label)).toEqual(['Stage', 'Hall']);
  });
});

describe('paxState', () => {
  it('shows (guests) until the value differs, then edited', () => {
    expect(paxState(catering, '400', 400)).toBe('guests');
    expect(paxState(catering, '750', 800)).toBe('edited');
    expect(paxState(dj, '5', 400)).toBeNull();
  });
});

describe('fillFromSame (decision 2026-11-25)', () => {
  it('fills empty cells only, never over a typed value', () => {
    const form = tick(newForm(dj), 'f-mehendi', 'f-sangeet');
    form.rows['f-sangeet'] = { ...rowOf(form, 'f-sangeet'), hours: '6' };
    form.same.hours = '4';
    const rows = fillFromSame(form, dj, functions);
    expect(rows['f-mehendi']?.hours).toBe('4');
    expect(rows['f-sangeet']?.hours).toBe('6');
    // Unticked rows are left alone.
    expect(rows['f-reception']?.hours).toBe('');
  });

  it('replaces pax that is still pre-filled from guests, but not typed pax', () => {
    const form = tick(newForm(catering), 'f-mehendi', 'f-sangeet');
    form.rows['f-sangeet'] = { ...rowOf(form, 'f-sangeet'), pax: '350' };
    form.same.pax = '300';
    const rows = fillFromSame(form, catering, functions);
    expect(rows['f-mehendi']?.pax).toBe('300');
    expect(rows['f-sangeet']?.pax).toBe('350');
  });

  it('fills an empty size measurement by label', () => {
    const form = tick(newForm(stage), 'f-mehendi');
    form.same.size = [
      { label: 'Stage', length: '40', width: '20' },
      { label: 'Hall', length: '', width: '' },
    ];
    expect(fillFromSame(form, stage, functions)['f-mehendi']?.size).toEqual([
      { label: 'Stage', length: '40', width: '20' },
      { label: 'Hall', length: '', width: '' },
    ]);
  });
});

describe('toLineInput', () => {
  it('sends ticked rows in event order, with only the service parameters', () => {
    const form = tick(newForm(catering), 'f-sangeet', 'f-mehendi');
    form.rows['f-mehendi'] = { ...rowOf(form, 'f-mehendi'), hours: '3', budget: '75,000' };
    expect(toLineInput(form, catering, functions)).toEqual({
      defaultVendorId: null,
      perFunctionVendor: false,
      lineBudget: null,
      notes: '',
      rows: [
        { eventFunctionId: 'f-mehendi', vendorId: null, quantities: { pax: 150 }, budget: 75_000 },
        { eventFunctionId: 'f-sangeet', vendorId: null, quantities: { pax: 400 }, budget: null },
      ],
    });
  });

  it('sends row vendors only while per-function vendors are on', () => {
    const form = { ...tick(newForm(dj), 'f-mehendi'), defaultVendorId: 'v1' };
    form.rows['f-mehendi'] = { ...rowOf(form, 'f-mehendi'), vendorId: 'v2' };
    expect(toLineInput(form, dj, functions).rows[0]?.vendorId).toBeNull();
    expect(toLineInput({ ...form, perFunctionVendor: true }, dj, functions).rows[0]?.vendorId).toBe(
      'v2',
    );
  });

  it('keeps complete size measurements only', () => {
    const form = tick(newForm(stage), 'f-mehendi');
    form.rows['f-mehendi'] = {
      ...rowOf(form, 'f-mehendi'),
      size: [
        { label: 'Stage', length: '40', width: '20' },
        { label: 'Hall', length: '', width: '' },
      ],
    };
    expect(toLineInput(form, stage, functions).rows[0]?.quantities).toEqual({
      size: [{ label: 'Stage', lengthFt: 40, widthFt: 20 }],
    });
  });
});

describe('budgets', () => {
  it('totals row budgets live, else the line budget', () => {
    const form = newForm(dj, saved);
    expect(formTotal(form, functions)).toBe(75_000);
    expect(usesRowBudgets(form)).toBe(true);
    const lineOnly = {
      ...form,
      lineBudget: '1,80,000',
      rows: {
        ...form.rows,
        'f-sangeet': { ...rowOf(form, 'f-sangeet'), budget: '' },
        'f-reception': { ...rowOf(form, 'f-reception'), budget: '' },
      },
    };
    expect(formTotal(lineOnly, functions)).toBe(1_80_000);
  });

  it('refuses a line budget together with row budgets', () => {
    const result = lineFormSchema().safeParse({
      ...newForm(dj, saved),
      lineBudget: '50,000',
    });
    expect(result.success).toBe(false);
  });
});

describe('lineFormSchema', () => {
  const issues = (form: LineForm) => {
    const result = lineFormSchema().safeParse(form);
    return result.success ? [] : result.error.issues.map((issue) => issue.message);
  };

  it('needs a service and at least one function', () => {
    expect(issues({ ...newForm(dj), serviceId: '' })).toEqual([
      'Choose a service',
      'Tick at least one function',
    ]);
  });

  it('checks ticked rows only', () => {
    const form = tick(newForm(dj), 'f-mehendi');
    form.rows['f-mehendi'] = { ...rowOf(form, 'f-mehendi'), hours: '2.25' };
    form.rows['f-sangeet'] = { ...rowOf(form, 'f-sangeet'), hours: 'lots' };
    expect(issues(form)).toEqual(['Half-hour steps, like 4.5']);
  });

  it('needs both sides of a size', () => {
    const form = tick(newForm(stage), 'f-mehendi');
    rowOf(form, 'f-mehendi').size[0] = { label: 'Stage', length: '40', width: '' };
    expect(issues(form)).toEqual(['Enter length and width in feet']);
  });
});

describe('untickWarnings', () => {
  it('names what an unticked function will lose', () => {
    const form = tick(newForm(dj, saved), 'f-reception');
    expect(untickWarnings(saved, form, dj.parameters, functions)).toEqual([
      "Sangeet's ₹40,000 and 5 hrs will be removed when you save.",
    ]);
    expect(untickWarnings(undefined, form, dj.parameters, functions)).toEqual([]);
  });
});

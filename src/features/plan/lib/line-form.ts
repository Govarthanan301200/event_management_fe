import { z } from 'zod';
import type { RowQuantities } from '@/features/vendors';
import { formatINR, parseRupees } from '@/lib/format';
import type { LineInput, Quantities, ServiceLine } from '../api/plan.schema';
import { formatQuantity, type ParameterKey } from './quantities';
import { lineTotal } from './rollup';

// The S8 drawer's form model (spec §11). Inputs hold strings; this file turns them into the
// request body and back, and holds the drawer's rules as plain functions.

export type SizeForm = { label: string; length: string; width: string };

export type RowForm = {
  /** '' = the line's default vendor. Used only while per-function vendors are on. */
  vendorId: string;
  pax: string;
  hours: string;
  minutes: string;
  work: string;
  /** One measurement per category size label. */
  size: SizeForm[];
  budget: string;
};

export type QuantityForm = Omit<RowForm, 'vendorId' | 'budget'>;

export type LineForm = {
  categoryId: string;
  serviceId: string;
  /** '' = no vendor yet. */
  defaultVendorId: string;
  perFunctionVendor: boolean;
  /** Ticked functions. */
  functionIds: string[];
  /** A row for every function on the event, so unticking and re-ticking keeps what was typed. */
  rows: Record<string, RowForm>;
  /** The "Same for all" row. */
  same: QuantityForm;
  lineBudget: string;
  notes: string;
};

/** What the drawer needs to know about the chosen service. */
export type ServiceContext = {
  parameters: readonly ParameterKey[];
  /** Category pre-fills pax from guests and the service is measured in pax (core rule 5). */
  paxPrefill: boolean;
  sizeLabels: readonly string[];
};

export type FunctionInfo = { id: string; name: string; guestCount: number };

const emptySize = (labels: readonly string[]): SizeForm[] =>
  labels.map((label) => ({ label, length: '', width: '' }));

function emptyQuantities(labels: readonly string[]): QuantityForm {
  return { pax: '', hours: '', minutes: '', work: '', size: emptySize(labels) };
}

const text = (value: number | undefined) => (value === undefined ? '' : String(value));

/** Form values for Add (empty, pax pre-filled) or Edit (from the saved line). */
export function toLineForm(args: {
  categoryId: string;
  serviceId: string;
  service: ServiceContext;
  functions: readonly FunctionInfo[];
  line?: ServiceLine | undefined;
}): LineForm {
  const { service, functions, line } = args;
  const saved = new Map((line?.rows ?? []).map((row) => [row.eventFunctionId, row]));
  const rows: Record<string, RowForm> = {};
  for (const fn of functions) {
    const row = saved.get(fn.id);
    const q: Quantities = row?.quantities ?? {};
    const sizes = emptySize(service.sizeLabels);
    for (const m of q.size ?? []) {
      const slot = sizes.find((s) => s.label === m.label);
      if (slot) Object.assign(slot, { length: String(m.lengthFt), width: String(m.widthFt) });
      else sizes.push({ label: m.label, length: String(m.lengthFt), width: String(m.widthFt) });
    }
    rows[fn.id] = {
      vendorId: row?.vendorId ?? '',
      pax: row ? text(q.pax) : service.paxPrefill ? String(fn.guestCount) : '',
      hours: text(q.hours),
      minutes: text(q.minutes),
      work: q.work ?? '',
      size: sizes,
      budget: row?.budget === null || row?.budget === undefined ? '' : String(row.budget),
    };
  }
  return {
    categoryId: args.categoryId,
    serviceId: args.serviceId,
    defaultVendorId: line?.defaultVendorId ?? '',
    perFunctionVendor: line?.perFunctionVendor ?? false,
    functionIds: line ? functions.filter((fn) => saved.has(fn.id)).map((fn) => fn.id) : [],
    rows,
    same: emptyQuantities(service.sizeLabels),
    lineBudget:
      line?.lineBudget === null || line?.lineBudget === undefined ? '' : String(line.lineBudget),
    notes: line?.notes ?? '',
  };
}

/** Pax shows "(guests)" while it equals the guest count on a pre-filled row, else "edited". */
export function paxState(
  service: ServiceContext,
  pax: string,
  guestCount: number,
): 'guests' | 'edited' | null {
  if (!service.paxPrefill) return null;
  return pax === String(guestCount) ? 'guests' : 'edited';
}

/**
 * "Same for all" (decision 2026-11-25): copies each value into ticked rows only where that cell
 * is empty or still pre-filled from guests; never over a value the planner typed.
 */
export function fillFromSame(
  values: LineForm,
  service: ServiceContext,
  functions: readonly FunctionInfo[],
): Record<string, RowForm> {
  const guests = new Map(functions.map((fn) => [fn.id, fn.guestCount]));
  const next = { ...values.rows };
  for (const id of values.functionIds) {
    const current = next[id];
    if (!current) continue;
    const row: RowForm = { ...current, size: current.size.map((m) => ({ ...m })) };
    for (const key of ['pax', 'hours', 'minutes', 'work'] as const) {
      const value = values.same[key].trim();
      if (value === '' || !service.parameters.includes(key)) continue;
      const prefilled =
        key === 'pax' && paxState(service, row.pax, guests.get(id) ?? -1) === 'guests';
      if (row[key].trim() === '' || prefilled) row[key] = value;
    }
    if (service.parameters.includes('size')) {
      for (const same of values.same.size) {
        if (same.length.trim() === '' || same.width.trim() === '') continue;
        const slot = row.size.find((m) => m.label === same.label);
        if (slot?.length.trim() === '' && slot.width.trim() === '') {
          slot.length = same.length;
          slot.width = same.width;
        }
      }
    }
    next[id] = row;
  }
  return next;
}

function toQuantities(row: QuantityForm, parameters: readonly ParameterKey[]): Quantities {
  const q: Quantities = {};
  if (parameters.includes('pax') && row.pax.trim() !== '') q.pax = Number(row.pax);
  if (parameters.includes('hours') && row.hours.trim() !== '') q.hours = Number(row.hours);
  if (parameters.includes('minutes') && row.minutes.trim() !== '') q.minutes = Number(row.minutes);
  if (parameters.includes('work') && row.work.trim() !== '') q.work = row.work.trim();
  if (parameters.includes('size')) {
    const size = row.size
      .filter((m) => m.length.trim() !== '' && m.width.trim() !== '')
      .map((m) => ({ label: m.label, lengthFt: Number(m.length), widthFt: Number(m.width) }));
    if (size.length > 0) q.size = size;
  }
  return q;
}

/** Ticked rows in the event's function order. */
function tickedRows(values: LineForm, functions: readonly FunctionInfo[]) {
  const ticked = new Set(values.functionIds);
  return functions.flatMap((fn) => {
    const row = values.rows[fn.id];
    return ticked.has(fn.id) && row ? [{ fn, row }] : [];
  });
}

/** The request body. Only effective parameters are sent; empty budgets are null. */
export function toLineInput(
  values: LineForm,
  service: ServiceContext,
  functions: readonly FunctionInfo[],
): LineInput {
  return {
    defaultVendorId: values.defaultVendorId || null,
    perFunctionVendor: values.perFunctionVendor,
    lineBudget: parseRupees(values.lineBudget),
    notes: values.notes.trim(),
    rows: tickedRows(values, functions).map(({ fn, row }) => ({
      eventFunctionId: fn.id,
      vendorId: values.perFunctionVendor && row.vendorId ? row.vendorId : null,
      quantities: toQuantities(row, service.parameters),
      budget: parseRupees(row.budget),
    })),
  };
}

/** The live total in the drawer (spec §11: totals update live). */
export function formTotal(values: LineForm, functions: readonly FunctionInfo[]): number {
  const rows = tickedRows(values, functions).map(({ row }) => ({
    budget: rupeesValid(row.budget) ? parseRupees(row.budget) : null,
  }));
  return lineTotal({
    lineBudget: rupeesValid(values.lineBudget) ? parseRupees(values.lineBudget) : null,
    rows,
  });
}

/** Quantities of the ticked rows, for the vendor-rate suggestion. */
export function suggestionRows(
  values: LineForm,
  service: ServiceContext,
  functions: readonly FunctionInfo[],
): RowQuantities[] {
  return tickedRows(values, functions).map(({ row }) => {
    const q = toQuantities(row, service.parameters);
    return {
      pax: q.pax ?? null,
      hours: q.hours ?? null,
      minutes: q.minutes ?? null,
      size: q.size ?? null,
    };
  });
}

/** Whether any ticked row has a budget (then the line budget is off, and vice versa). */
export function usesRowBudgets(values: LineForm): boolean {
  return values.functionIds.some((id) => (values.rows[id]?.budget.trim() ?? '') !== '');
}

/**
 * Decision 2026-11-25: unticking a function that has saved quantities or a budget warns before
 * Save, e.g. "Sangeet's ₹40,000 and 5 hrs will be removed when you save."
 */
export function untickWarnings(
  line: ServiceLine | undefined,
  values: LineForm,
  parameters: readonly ParameterKey[],
  functions: readonly FunctionInfo[],
): string[] {
  if (!line) return [];
  const ticked = new Set(values.functionIds);
  return line.rows.flatMap((row) => {
    if (ticked.has(row.eventFunctionId)) return [];
    const fn = functions.find((f) => f.id === row.eventFunctionId);
    const parts = [
      ...(row.budget === null ? [] : [formatINR(row.budget)]),
      ...parameters
        .filter((key) => !(key === 'pax' && !row.paxEdited))
        .map((key) => formatQuantity(key, row.quantities))
        .filter((part): part is string => part !== null),
    ];
    if (!fn || parts.length === 0) return [];
    const list =
      parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}`;
    return [`${fn.name}'s ${list} will be removed when you save.`];
  });
}

// Validation (same limits as the backend's service-lines.schema.ts).

const RUPEES = /^\d{1,3}(,\d{2,3})*$|^\d+$/;
const MAX_RUPEES = 2_147_483_647;

function rupeesValid(value: string): boolean {
  const trimmed = value.trim();
  return (
    trimmed === '' || (RUPEES.test(trimmed) && Number(trimmed.replace(/,/g, '')) <= MAX_RUPEES)
  );
}

const WHOLE = /^\d{1,6}$/;
const HALF_HOURS = /^\d{1,4}(\.[05])?$/;
const FEET = /^\d{1,5}(\.\d{1,2})?$/;

/**
 * The drawer's Zod schema. Only filled cells are checked, and cells for parameters the service
 * doesn't have stay empty, so one schema serves every service.
 */
export function lineFormSchema() {
  return z.custom<LineForm>().superRefine((values, ctx) => {
    if (values.serviceId === '') {
      ctx.addIssue({ code: 'custom', path: ['serviceId'], message: 'Choose a service' });
    }
    if (values.functionIds.length === 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['functionIds'],
        message: 'Tick at least one function',
      });
    }
    if (!rupeesValid(values.lineBudget)) {
      ctx.addIssue({
        code: 'custom',
        path: ['lineBudget'],
        message: 'Use whole rupees, like 1,80,000',
      });
    }
    if (values.lineBudget.trim() !== '' && usesRowBudgets(values)) {
      ctx.addIssue({
        code: 'custom',
        path: ['lineBudget'],
        message: 'Use a line budget or budgets per function, not both',
      });
    }
    for (const id of values.functionIds) {
      const row = values.rows[id];
      if (!row) continue;
      const at = (field: string) => ['rows', id, field];
      if (row.pax.trim() !== '' && !WHOLE.test(row.pax.trim())) {
        ctx.addIssue({ code: 'custom', path: at('pax'), message: 'Whole number' });
      }
      if (row.minutes.trim() !== '' && !WHOLE.test(row.minutes.trim())) {
        ctx.addIssue({ code: 'custom', path: at('minutes'), message: 'Whole minutes' });
      }
      if (row.hours.trim() !== '' && !HALF_HOURS.test(row.hours.trim())) {
        ctx.addIssue({ code: 'custom', path: at('hours'), message: 'Half-hour steps, like 4.5' });
      }
      row.size.forEach((m, index) => {
        const filled = [m.length.trim(), m.width.trim()].filter((v) => v !== '');
        const bad = filled.some((v) => !FEET.test(v) || Number(v) <= 0);
        if (filled.length === 1 || bad) {
          ctx.addIssue({
            code: 'custom',
            path: ['rows', id, 'size', index, 'length'],
            message: 'Enter length and width in feet',
          });
        }
      });
      if (!rupeesValid(row.budget)) {
        ctx.addIssue({ code: 'custom', path: at('budget'), message: 'Whole rupees' });
      }
    }
  });
}

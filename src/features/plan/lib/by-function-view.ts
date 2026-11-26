import type { Catalogue } from '@/features/catalogue';
import type { EventMoneySummary } from '@/features/summary';
import type { ServiceLine, ServicePlan } from '../api/plan.schema';
import { serviceContext } from './plan-view';
import { summariseQuantities } from './quantities';

/** One service as it stands for the chosen function. */
export type FunctionLineView = {
  lineId: string;
  serviceName: string;
  /** Spec §6 effective vendor: the row's vendor when per-function vendors are on, else the line's. */
  vendor: string | null;
  /** A per-function vendor that differs from the line's default (design system "changed" tag). */
  vendorChanged: boolean;
  quantities: string;
};

export type BudgetedLineView = FunctionLineView & {
  /** The amount attributed to this function (spec §12); null when nothing is budgeted. */
  amount: number | null;
};

export type SharedLineView = FunctionLineView & {
  /** The whole line budget: never split across functions (spec §12). */
  total: number;
  functionCount: number;
};

export type FunctionCategoryView = {
  id: string;
  name: string;
  /** Spec §12 category planned (function). */
  amount: number;
  lines: BudgetedLineView[];
};

export type FunctionPlanView = {
  categories: FunctionCategoryView[];
  /** S9 "Shared across event": lines covering this function whose budget is Shared. */
  shared: SharedLineView[];
};

function lineFor(
  line: ServiceLine,
  functionId: string,
  catalogue: Catalogue,
): FunctionLineView | null {
  const row = line.rows.find((r) => r.eventFunctionId === functionId);
  if (!row) return null;
  const rowVendor = line.perFunctionVendor && row.vendorId !== null;
  const vendor = rowVendor ? row.vendor : line.defaultVendor;
  return {
    lineId: line.id,
    serviceName: line.serviceName,
    vendor: vendor?.name ?? null,
    vendorChanged: rowVendor && row.vendorId !== line.defaultVendorId,
    quantities: summariseQuantities(
      serviceContext(catalogue, line.serviceId)?.parameters ?? [],
      row.quantities,
    ),
  };
}

/**
 * S9 for one function: categories in catalogue order with the services covering it, and the
 * Shared group. Money comes from the server's spec §12 attribution; nothing is computed here.
 */
export function functionPlanView(
  functionId: string,
  plan: ServicePlan,
  summary: Pick<EventMoneySummary, 'categories' | 'lines'>,
  catalogue: Catalogue,
): FunctionPlanView {
  const rollups = new Map(summary.lines.map((line) => [line.id, line]));
  const shared: SharedLineView[] = [];
  const byCategory = new Map<string, BudgetedLineView[]>();
  for (const line of plan.lines) {
    const view = lineFor(line, functionId, catalogue);
    const rollup = rollups.get(line.id);
    if (!view) continue;
    if (rollup && rollup.shared > 0) {
      shared.push({ ...view, total: rollup.shared, functionCount: line.rows.length });
      continue;
    }
    const lines = byCategory.get(line.categoryId) ?? [];
    lines.push({ ...view, amount: rollup?.byFunction[functionId] ?? null });
    byCategory.set(line.categoryId, lines);
  }
  const categories = summary.categories.flatMap((category) => {
    const lines = byCategory.get(category.id);
    if (!lines) return [];
    return [
      { id: category.id, name: category.name, amount: category.byFunction[functionId] ?? 0, lines },
    ];
  });
  return { categories, shared };
}

/** "YYYY-MM-DD" today in the company time zone (default Asia/Kolkata). */
export function todayIn(timeZone = 'Asia/Kolkata', now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone }).format(now);
}

/**
 * The function S9 opens on: the one asked for (`?fn=`), else the next one from today, else the
 * first. Functions are in event order.
 */
export function pickFunction<T extends { id: string; date: string }>(
  functions: readonly T[],
  requested: string | null,
  today: string,
): T | undefined {
  return (
    functions.find((fn) => fn.id === requested) ??
    functions.find((fn) => fn.date >= today) ??
    functions[0]
  );
}

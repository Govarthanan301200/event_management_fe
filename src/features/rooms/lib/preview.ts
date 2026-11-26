import type { SheetPlan } from './sheet';

export const plural = (n: number, one: string, many: string) =>
  n === 1 ? `1 ${one}` : `${String(n)} ${many}`;

/** The preview's summary lines (decision 2026-11-27: say what will happen before it happens). */
export function previewLines(plan: SheetPlan): string[] {
  return [
    plural(plan.rows.length, 'row', 'rows'),
    ...(plan.newHotels.length > 0
      ? [
          `${plural(plan.newHotels.length, 'new hotel', 'new hotels')}: ${plan.newHotels.join(', ')}`,
        ]
      : []),
    ...(plan.skippedNoName > 0
      ? [`${plural(plan.skippedNoName, 'row', 'rows')} without a name skipped`]
      : []),
    ...plan.unreadable.map(
      (item) =>
        `${plural(item.count, 'value', 'values')} in ${item.column} couldn't be read and stay blank`,
    ),
    ...(plan.shortened > 0
      ? [`${plural(plan.shortened, 'value', 'values')} shortened to fit`]
      : []),
  ];
}

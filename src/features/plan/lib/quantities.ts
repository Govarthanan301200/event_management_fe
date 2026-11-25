import type { Quantities } from '../api/plan.schema';

export type ParameterKey = 'pax' | 'hours' | 'minutes' | 'size' | 'work';

const number = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 });

/** One parameter as shown in tables: "400 pax", "4.5 hrs", "10 min", "Stage 40 × 20 ft". */
export function formatQuantity(key: ParameterKey, quantities: Quantities): string | null {
  switch (key) {
    case 'pax':
      return quantities.pax === undefined ? null : `${number.format(quantities.pax)} pax`;
    case 'hours':
      return quantities.hours === undefined
        ? null
        : `${number.format(quantities.hours)} ${quantities.hours === 1 ? 'hr' : 'hrs'}`;
    case 'minutes':
      return quantities.minutes === undefined ? null : `${number.format(quantities.minutes)} min`;
    case 'size':
      return quantities.size && quantities.size.length > 0
        ? quantities.size
            .map((m) => `${m.label} ${number.format(m.lengthFt)} × ${number.format(m.widthFt)} ft`)
            .join(', ')
        : null;
    case 'work':
      return quantities.work ?? null;
  }
}

/** All of a row's quantities in parameter order: "400 pax · 5 hrs". */
export function summariseQuantities(
  parameters: readonly ParameterKey[],
  quantities: Quantities,
): string {
  return parameters
    .map((key) => formatQuantity(key, quantities))
    .filter((text): text is string => text !== null)
    .join(' · ');
}

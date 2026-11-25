import { formatRate } from '@/features/vendors';
import type { VendorOption } from '../api/plan.schema';

/** Radix Select can't hold '' as an item value, so "No vendor yet" uses this. */
export const NO_VENDOR = '__none';

/** Text for a vendor option, with its rate for this service when it has one. */
export function vendorLabel(option: VendorOption): string {
  return option.rateAmount !== null && option.rateBasis !== null
    ? `${option.name} · ${formatRate(option.rateAmount, option.rateBasis)}`
    : option.name;
}

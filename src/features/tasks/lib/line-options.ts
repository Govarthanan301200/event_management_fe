import type { ServicePlan } from '@/features/plan/api/plan.schema';

export type LineOption = { id: string; label: string };

/** The task's "Service line" choices: "DJ / VDJ · Beat Republic" (spec §13: shows the vendor). */
export function lineOptions(plan: Pick<ServicePlan, 'lines'> | undefined): LineOption[] {
  return (plan?.lines ?? []).map((line) => ({
    id: line.id,
    label: line.defaultVendor
      ? `${line.serviceName} · ${line.defaultVendor.name}`
      : line.serviceName,
  }));
}

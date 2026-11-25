import type { Catalogue, CatalogueCategory } from '@/features/catalogue';
import type { ServicePlan, ServiceLine } from '../api/plan.schema';
import type { ServiceContext } from './line-form';
import { sumOfLines } from './rollup';

export type BandView = {
  category: CatalogueCategory;
  lines: ServiceLine[];
  planned: number;
  envelope: number | null;
};

/**
 * S7 bands in catalogue order: every active category (an empty one is a "not covered yet" prompt)
 * plus any archived category that still has lines.
 */
export function groupByCategory(catalogue: Catalogue, plan: ServicePlan): BandView[] {
  const envelopes = new Map(plan.envelopes.map((e) => [e.categoryId, e.amount]));
  return catalogue.categories.flatMap((category) => {
    const lines = plan.lines.filter((line) => line.categoryId === category.id);
    if (category.archivedAt && lines.length === 0) return [];
    return [
      { category, lines, planned: sumOfLines(lines), envelope: envelopes.get(category.id) ?? null },
    ];
  });
}

/** What S8 needs to know about a service: its effective parameters, pax pre-fill and size labels. */
export function serviceContext(
  catalogue: Catalogue,
  serviceId: string,
): (ServiceContext & { categoryId: string; name: string }) | null {
  for (const category of catalogue.categories) {
    const service = category.services.find((s) => s.id === serviceId);
    if (service) {
      return {
        categoryId: category.id,
        name: service.name,
        parameters: service.effectiveParameters,
        paxPrefill: category.paxPrefill && service.effectiveParameters.includes('pax'),
        sizeLabels: category.sizeLabels,
      };
    }
  }
  return null;
}

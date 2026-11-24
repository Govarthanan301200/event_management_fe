import type { Catalogue } from '@/features/catalogue';
import type { VendorFacets, VendorSummary } from '../api/vendors.schema';

export type CountedItem = { id: string; name: string; count: number };

/** S3 left list: active categories in catalogue order with their vendor counts (0 included). */
export function categoryEntries(catalogue: Catalogue, facets: VendorFacets): CountedItem[] {
  const counts = new Map(facets.categories.map((entry) => [entry.categoryId, entry.count]));
  return catalogue.categories
    .filter((category) => !category.archivedAt)
    .map((category) => ({
      id: category.id,
      name: category.name,
      count: counts.get(category.id) ?? 0,
    }));
}

/**
 * S3 service chips for one category: active services that have vendors, in catalogue order.
 * The selected service always shows, so the planner can see and clear the filter.
 */
export function serviceChips(
  catalogue: Catalogue,
  facets: VendorFacets,
  categoryId: string,
  selectedServiceId?: string,
): CountedItem[] {
  const category = catalogue.categories.find((entry) => entry.id === categoryId);
  if (!category) return [];
  const counts = new Map(facets.services.map((entry) => [entry.serviceId, entry.count]));
  return category.services
    .filter((service) => !service.archivedAt)
    .map((service) => ({ id: service.id, name: service.name, count: counts.get(service.id) ?? 0 }))
    .filter((chip) => chip.count > 0 || chip.id === selectedServiceId);
}

/** Row tags: services in the category being browsed first, then the rest (each in catalogue order). */
export function orderedTags(
  services: VendorSummary['services'],
  categoryId?: string,
): VendorSummary['services'] {
  if (!categoryId) return [...services];
  return [
    ...services.filter((service) => service.categoryId === categoryId),
    ...services.filter((service) => service.categoryId !== categoryId),
  ];
}

/** `tel:` link target: keep + and digits only. */
export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}

/**
 * WhatsApp link (spec §9 design idea). wa.me needs the country code: a 10-digit number is
 * assumed Indian (+91), the app's market.
 */
export function whatsAppHref(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  const international = digits.length === 10 ? `91${digits}` : digits.replace(/^0+/, '');
  return `https://wa.me/${international}`;
}

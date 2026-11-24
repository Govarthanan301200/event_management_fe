import type { Catalogue } from '@/features/catalogue';

export type IndexedService = {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  /** Position in catalogue order (categories, then services). */
  position: number;
  /** The service or its category is archived: it can't be newly linked (decision 2026-11-24). */
  archived: boolean;
};

/** Every service in the catalogue by id, with its category and catalogue position. */
export function indexCatalogue(catalogue: Catalogue): Map<string, IndexedService> {
  const index = new Map<string, IndexedService>();
  let position = 0;
  for (const category of catalogue.categories) {
    for (const service of category.services) {
      index.set(service.id, {
        id: service.id,
        name: service.name,
        categoryId: category.id,
        categoryName: category.name,
        position: position++,
        archived: service.archivedAt !== null || category.archivedAt !== null,
      });
    }
  }
  return index;
}

/** Active categories with their active services: what the service picker may offer. */
export function pickableCategories(catalogue: Catalogue) {
  return catalogue.categories
    .filter((category) => !category.archivedAt)
    .map((category) => ({
      id: category.id,
      name: category.name,
      services: category.services.filter((service) => !service.archivedAt),
    }))
    .filter((category) => category.services.length > 0);
}

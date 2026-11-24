import { useSearchParams } from 'react-router';
import type { CatalogueCategory } from '../api/catalogue.schema';

/**
 * The category shown on S2 lives in the URL (`?category=<id>`), so it survives refresh and
 * links. Falls back to the first active category, then to any category.
 */
export function useSelectedCategory(categories: readonly CatalogueCategory[]) {
  const [params, setParams] = useSearchParams();
  const requested = params.get('category');
  const selected =
    categories.find((category) => category.id === requested) ??
    categories.find((category) => !category.archivedAt) ??
    categories[0];

  return {
    selected,
    select: (categoryId: string) => {
      setParams({ category: categoryId }, { replace: true });
    },
  };
}

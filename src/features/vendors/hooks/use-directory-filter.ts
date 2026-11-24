import { useSearchParams } from 'react-router';
import type { DirectoryFilter } from '../api/vendors.api';

export type DirectoryScope =
  { kind: 'all' } | { kind: 'category'; categoryId: string } | { kind: 'archived' };

/**
 * S3 filters live in the URL (`?category=&service=&q=&view=archived`), so Back from a profile
 * returns to the same view and the view can be bookmarked. Search is ignored-case server-side.
 */
export function useDirectoryFilter() {
  const [params, setParams] = useSearchParams();
  const categoryId = params.get('category') ?? undefined;
  const serviceId = params.get('service') ?? undefined;
  const q = params.get('q') ?? '';
  const archived = params.get('view') === 'archived';

  const scope: DirectoryScope = archived
    ? { kind: 'archived' }
    : categoryId
      ? { kind: 'category', categoryId }
      : { kind: 'all' };

  const filter: DirectoryFilter = {
    archived,
    ...(scope.kind === 'category' ? { categoryId: scope.categoryId } : {}),
    ...(scope.kind === 'category' && serviceId ? { serviceId } : {}),
    ...(q.trim() ? { q: q.trim() } : {}),
  };

  const update = (change: Record<string, string | null>) => {
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        for (const [key, value] of Object.entries(change)) {
          if (value) next.set(key, value);
          else next.delete(key);
        }
        return next;
      },
      { replace: true },
    );
  };

  return {
    scope,
    serviceId: filter.serviceId,
    q,
    filter,
    /** The query string to come back to from a profile. */
    search: params.toString(),
    selectAll: () => {
      update({ category: null, service: null, view: null });
    },
    selectCategory: (id: string) => {
      update({ category: id, service: null, view: null });
    },
    selectArchived: () => {
      update({ category: null, service: null, view: 'archived' });
    },
    selectService: (id: string | null) => {
      update({ service: id });
    },
    setSearch: (text: string) => {
      update({ q: text });
    },
  };
}

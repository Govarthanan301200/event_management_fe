import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { errorMessage } from '@/lib/api-client';
import {
  catalogueKeys,
  catalogueOptions,
  createCategory,
  createService,
  reorderCategories,
  reorderServices,
  resetCatalogue,
  updateCategory,
  updateService,
  type CategoryChange,
  type ServiceChange,
  type ServiceInput,
} from '../api/catalogue.api';
import type { Catalogue } from '../api/catalogue.schema';
import { sortByIds } from '@/lib/order';

export function useCatalogue() {
  return useQuery(catalogueOptions());
}

function useRefreshCatalogue() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: catalogueKeys.tree() });
}

export function useCreateCategory() {
  const refresh = useRefreshCatalogue();
  return useMutation({ mutationFn: createCategory, onSuccess: refresh });
}

export function useUpdateCategory() {
  const refresh = useRefreshCatalogue();
  return useMutation({
    mutationFn: ({ id, change }: { id: string; change: CategoryChange }) =>
      updateCategory(id, change),
    onSuccess: refresh,
  });
}

export function useCreateService() {
  const refresh = useRefreshCatalogue();
  return useMutation({
    mutationFn: ({ categoryId, input }: { categoryId: string; input: ServiceInput }) =>
      createService(categoryId, input),
    onSuccess: refresh,
  });
}

export function useUpdateService() {
  const refresh = useRefreshCatalogue();
  return useMutation({
    mutationFn: ({ id, change }: { id: string; change: ServiceChange }) =>
      updateService(id, change),
    onSuccess: refresh,
  });
}

export function useResetCatalogue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: resetCatalogue,
    onSuccess: async (catalogue) => {
      queryClient.setQueryData(catalogueKeys.tree(), catalogue);
      await queryClient.invalidateQueries({ queryKey: catalogueKeys.functionTypes() });
    },
  });
}

/**
 * Reorders show at once (optimistic) and roll back with a toast if the save fails, then the
 * catalogue is refetched either way so it matches the server.
 */
function useOptimisticReorder(
  save: (ids: string[]) => Promise<unknown>,
  apply: (catalogue: Catalogue, ids: string[]) => Catalogue,
) {
  const queryClient = useQueryClient();
  const key = catalogueKeys.tree();
  return useMutation({
    mutationFn: save,
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Catalogue>(key);
      if (previous) queryClient.setQueryData(key, apply(previous, ids));
      return { previous };
    },
    onError: (error, _ids, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
      toast.error(errorMessage(error, "Couldn't save the new order. Try again."));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });
}

export function useReorderCategories() {
  return useOptimisticReorder(reorderCategories, (catalogue, ids) => ({
    ...catalogue,
    categories: sortByIds(catalogue.categories, ids),
  }));
}

export function useReorderServices(categoryId: string) {
  return useOptimisticReorder(
    (ids) => reorderServices(categoryId, ids),
    (catalogue, ids) => ({
      ...catalogue,
      categories: catalogue.categories.map((category) =>
        category.id === categoryId
          ? { ...category, services: sortByIds(category.services, ids) }
          : category,
      ),
    }),
  );
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { errorMessage } from '@/lib/api-client';
import {
  catalogueKeys,
  createFunctionType,
  functionTypesOptions,
  reorderFunctionTypes,
  updateFunctionType,
} from '../api/catalogue.api';
import type { FunctionType } from '../api/catalogue.schema';
import { sortByIds } from '../lib/order';

export function useFunctionTypes() {
  return useQuery(functionTypesOptions());
}

function useRefreshFunctionTypes() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: catalogueKeys.functionTypes() });
}

export function useCreateFunctionType() {
  const refresh = useRefreshFunctionTypes();
  return useMutation({ mutationFn: createFunctionType, onSuccess: refresh });
}

export function useUpdateFunctionType() {
  const refresh = useRefreshFunctionTypes();
  return useMutation({
    mutationFn: ({
      id,
      change,
    }: {
      id: string;
      change: Partial<{ name: string; archived: boolean }>;
    }) => updateFunctionType(id, change),
    onSuccess: refresh,
  });
}

/** Optimistic reorder with rollback, like the catalogue lists. */
export function useReorderFunctionTypes() {
  const queryClient = useQueryClient();
  const key = catalogueKeys.functionTypes();
  return useMutation({
    mutationFn: reorderFunctionTypes,
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<FunctionType[]>(key);
      if (previous) queryClient.setQueryData(key, sortByIds(previous, ids));
      return { previous };
    },
    onError: (error, _ids, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
      toast.error(errorMessage(error, "Couldn't save the new order. Try again."));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });
}

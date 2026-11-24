import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { catalogueKeys } from '@/features/catalogue';
import {
  checkPhone,
  createVendor,
  deleteVendor,
  updateVendor,
  vendorDetailOptions,
  vendorFacetsOptions,
  vendorListOptions,
  vendorsKeys,
  type DirectoryFilter,
  type VendorInput,
} from '../api/vendors.api';
import type { VendorDetail } from '../api/vendors.schema';

/** Keeps the current rows on screen while a new filter or search loads (no skeleton flash). */
export function useVendorList(filter: DirectoryFilter) {
  return useInfiniteQuery({ ...vendorListOptions(filter), placeholderData: keepPreviousData });
}

export function useVendorFacets() {
  return useQuery(vendorFacetsOptions());
}

export function useVendor(vendorId: string) {
  return useQuery(vendorDetailOptions(vendorId));
}

/**
 * After any vendor write: the saved profile goes straight into the cache, and lists, counts and
 * the catalogue's "can reset" flag (reset is refused while vendors offer services) refetch.
 */
function useAfterVendorWrite() {
  const queryClient = useQueryClient();
  return async (vendor: VendorDetail) => {
    queryClient.setQueryData(vendorsKeys.detail(vendor.id), vendor);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: vendorsKeys.lists() }),
      queryClient.invalidateQueries({ queryKey: vendorsKeys.facets() }),
      queryClient.invalidateQueries({ queryKey: catalogueKeys.tree() }),
    ]);
  };
}

export function useCreateVendor() {
  const afterWrite = useAfterVendorWrite();
  return useMutation({ mutationFn: createVendor, onSuccess: afterWrite });
}

export function useUpdateVendor() {
  const afterWrite = useAfterVendorWrite();
  return useMutation({
    mutationFn: ({
      id,
      change,
    }: {
      id: string;
      change: Partial<VendorInput> & { archived?: boolean };
    }) => updateVendor(id, change),
    onSuccess: afterWrite,
  });
}

export function useDeleteVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteVendor,
    onSuccess: async (_result, vendorId) => {
      queryClient.removeQueries({ queryKey: vendorsKeys.detail(vendorId) });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: vendorsKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: vendorsKeys.facets() }),
        queryClient.invalidateQueries({ queryKey: catalogueKeys.tree() }),
      ]);
    },
  });
}

/** Duplicate-phone warning (decision 2026-11-24): checked when the phone field loses focus. */
export function usePhoneCheck(exceptId?: string) {
  return useMutation({ mutationFn: (phone: string) => checkPhone(phone, exceptId) });
}

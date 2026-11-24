import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';
import { z } from 'zod';
import { getAccessToken } from '@/features/auth/api/supabase';
import { apiRequest, dataOf } from '@/lib/api-client';
import {
  phoneMatchSchema,
  vendorDetailSchema,
  vendorFacetsSchema,
  vendorPageSchema,
  type RateBasis,
} from './vendors.schema';

/** S3 filters, as kept in the URL. */
export type DirectoryFilter = {
  categoryId?: string | undefined;
  serviceId?: string | undefined;
  q?: string | undefined;
  archived: boolean;
};

export const vendorsKeys = {
  all: ['vendors'] as const,
  lists: () => [...vendorsKeys.all, 'list'] as const,
  list: (filter: DirectoryFilter) => [...vendorsKeys.lists(), filter] as const,
  facets: () => [...vendorsKeys.all, 'facets'] as const,
  detail: (vendorId: string) => [...vendorsKeys.all, 'detail', vendorId] as const,
};

const PAGE_SIZE = 30;

export function vendorListOptions(filter: DirectoryFilter) {
  return infiniteQueryOptions({
    queryKey: vendorsKeys.list(filter),
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
      if (filter.categoryId) params.set('categoryId', filter.categoryId);
      if (filter.serviceId) params.set('serviceId', filter.serviceId);
      if (filter.q) params.set('q', filter.q);
      if (filter.archived) params.set('archived', 'true');
      if (pageParam) params.set('cursor', pageParam);
      return apiRequest(`/api/v1/vendors?${params.toString()}`, vendorPageSchema, {
        token: await getAccessToken(),
      });
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

export function vendorFacetsOptions() {
  return queryOptions({
    queryKey: vendorsKeys.facets(),
    queryFn: async () =>
      apiRequest('/api/v1/vendors/facets', dataOf(vendorFacetsSchema), {
        token: await getAccessToken(),
      }),
  });
}

export function vendorDetailOptions(vendorId: string) {
  return queryOptions({
    queryKey: vendorsKeys.detail(vendorId),
    queryFn: async () =>
      apiRequest(`/api/v1/vendors/${encodeURIComponent(vendorId)}`, dataOf(vendorDetailSchema), {
        token: await getAccessToken(),
      }),
  });
}

/** What the API accepts on create; on update every field is optional. */
export type VendorInput = {
  name: string;
  contactPerson: string;
  phone: string;
  altPhone: string;
  city: string;
  address: string;
  portfolioUrl: string;
  notes: string;
  contacts: { name: string; role: string; phone: string }[];
  services: {
    serviceId: string;
    rateAmount: number | null;
    rateBasis: RateBasis | null;
    rateNote: string;
  }[];
};

export async function createVendor(input: VendorInput) {
  return apiRequest('/api/v1/vendors', dataOf(vendorDetailSchema), {
    method: 'POST',
    token: await getAccessToken(),
    body: input,
  });
}

export async function updateVendor(
  vendorId: string,
  change: Partial<VendorInput> & { archived?: boolean },
) {
  return apiRequest(`/api/v1/vendors/${encodeURIComponent(vendorId)}`, dataOf(vendorDetailSchema), {
    method: 'PATCH',
    token: await getAccessToken(),
    body: change,
  });
}

export async function deleteVendor(vendorId: string) {
  return apiRequest(`/api/v1/vendors/${encodeURIComponent(vendorId)}`, z.undefined(), {
    method: 'DELETE',
    token: await getAccessToken(),
  });
}

/** Duplicate-phone warning. A POST, so the number never appears in a URL. */
export async function checkPhone(phone: string, exceptId?: string) {
  return apiRequest('/api/v1/vendors/phone-check', dataOf(z.array(phoneMatchSchema)), {
    method: 'POST',
    token: await getAccessToken(),
    body: { phone, ...(exceptId ? { exceptId } : {}) },
  });
}

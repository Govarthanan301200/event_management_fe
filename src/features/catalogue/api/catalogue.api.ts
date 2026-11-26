import { queryOptions } from '@tanstack/react-query';
import { z } from 'zod';
import { getAccessToken } from '@/features/auth/api/supabase';
import { apiRequest, dataOf } from '@/lib/api-client';
import {
  catalogueSchema,
  categorySchema,
  functionTypeSchema,
  serviceSchema,
  type ParameterKey,
} from './catalogue.schema';

export const catalogueKeys = {
  all: ['catalogue'] as const,
  tree: () => [...catalogueKeys.all, 'tree'] as const,
  functionTypes: () => [...catalogueKeys.all, 'function-types'] as const,
};

const noContent = z.undefined();

async function send<T extends z.ZodType>(
  path: string,
  schema: T,
  method: 'POST' | 'PATCH' | 'PUT',
  body?: unknown,
) {
  return apiRequest(path, schema, { method, token: await getAccessToken(), body });
}

export function catalogueOptions() {
  return queryOptions({
    queryKey: catalogueKeys.tree(),
    queryFn: async () =>
      apiRequest('/api/v1/catalogue', dataOf(catalogueSchema), { token: await getAccessToken() }),
  });
}

export function functionTypesOptions() {
  return queryOptions({
    queryKey: catalogueKeys.functionTypes(),
    queryFn: async () =>
      apiRequest('/api/v1/function-types', dataOf(z.array(functionTypeSchema)), {
        token: await getAccessToken(),
      }),
  });
}

// Categories

export type CategoryChange = Partial<{
  name: string;
  parameters: ParameterKey[];
  paxPrefill: boolean;
  sizeLabels: string[];
  archived: boolean;
}>;

export function createCategory(body: { name: string; parameters: ParameterKey[] }) {
  return send('/api/v1/catalogue/categories', dataOf(categorySchema), 'POST', body);
}

export function updateCategory(categoryId: string, change: CategoryChange) {
  return send(
    `/api/v1/catalogue/categories/${encodeURIComponent(categoryId)}`,
    dataOf(categorySchema),
    'PATCH',
    change,
  );
}

export function reorderCategories(ids: string[]) {
  return send('/api/v1/catalogue/categories/order', noContent, 'PUT', { ids });
}

// Services

export type ServiceInput = {
  name: string;
  description: string;
  showOnClientForm: boolean;
  hasRooms: boolean;
  parametersOverride: ParameterKey[] | null;
};

export type ServiceChange = Partial<ServiceInput & { categoryId: string; archived: boolean }>;

export function createService(categoryId: string, body: ServiceInput) {
  return send(
    `/api/v1/catalogue/categories/${encodeURIComponent(categoryId)}/services`,
    dataOf(serviceSchema),
    'POST',
    body,
  );
}

export function updateService(serviceId: string, change: ServiceChange) {
  return send(
    `/api/v1/catalogue/services/${encodeURIComponent(serviceId)}`,
    dataOf(serviceSchema),
    'PATCH',
    change,
  );
}

export function reorderServices(categoryId: string, ids: string[]) {
  return send(
    `/api/v1/catalogue/categories/${encodeURIComponent(categoryId)}/services/order`,
    noContent,
    'PUT',
    { ids },
  );
}

export function resetCatalogue() {
  return send('/api/v1/catalogue/reset', dataOf(catalogueSchema), 'POST');
}

// Function types

export function createFunctionType(name: string) {
  return send('/api/v1/function-types', dataOf(functionTypeSchema), 'POST', { name });
}

export function updateFunctionType(
  functionTypeId: string,
  change: Partial<{ name: string; archived: boolean }>,
) {
  return send(
    `/api/v1/function-types/${encodeURIComponent(functionTypeId)}`,
    dataOf(functionTypeSchema),
    'PATCH',
    change,
  );
}

export function reorderFunctionTypes(ids: string[]) {
  return send('/api/v1/function-types/order', noContent, 'PUT', { ids });
}

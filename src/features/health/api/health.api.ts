import { queryOptions } from '@tanstack/react-query';
import { apiGet } from '@/lib/api-client';
import { readinessSchema } from './health.schema';

export const healthKeys = {
  all: ['health'] as const,
  ready: () => [...healthKeys.all, 'ready'] as const,
};

export function readinessOptions() {
  return queryOptions({
    queryKey: healthKeys.ready(),
    queryFn: () => apiGet('/health/ready', readinessSchema),
    retry: false,
  });
}

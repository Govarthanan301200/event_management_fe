import { queryOptions } from '@tanstack/react-query';
import { apiGet } from '@/lib/api-client';
import { messagesResponseSchema } from './messages.schema';

export const messagesKeys = {
  all: ['messages'] as const,
  list: () => [...messagesKeys.all, 'list'] as const,
};

export function messagesListOptions() {
  return queryOptions({
    queryKey: messagesKeys.list(),
    queryFn: async () => (await apiGet('/api/messages', messagesResponseSchema)).data,
  });
}

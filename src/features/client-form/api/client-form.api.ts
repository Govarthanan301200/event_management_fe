import { queryOptions } from '@tanstack/react-query';
import { apiRequest, dataOf } from '@/lib/api-client';
import { clientFormSchema, submissionSchema, type Answers } from './client-form.schema';

export const clientFormKeys = {
  all: ['client-form'] as const,
  detail: (token: string) => [...clientFormKeys.all, token] as const,
};

export function clientFormOptions(token: string) {
  return queryOptions({
    queryKey: clientFormKeys.detail(token),
    queryFn: () =>
      apiRequest(`/api/v1/public/f/${encodeURIComponent(token)}`, dataOf(clientFormSchema)),
    // A missing or locked link won't fix itself on retry.
    retry: (failureCount, error) =>
      failureCount < 2 && !('status' in error && error.status === 404),
    // Only refetch on purpose (after sending): a background refetch would reset what the client is typing.
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

/** Ticked services in catalogue order; blank notes are sent as absent. */
export function toSelections(answers: Answers, serviceOrder: readonly string[]) {
  return serviceOrder.flatMap((serviceId) => {
    const answer = answers.services[serviceId];
    if (!answer?.ticked) return [];
    const note = answer.note.trim();
    return [note ? { serviceId, note } : { serviceId }];
  });
}

export type SubmitVariables = {
  token: string;
  selections: ReturnType<typeof toSelections>;
  /** One key per "Send to planner" press; automatic retries reuse it (backend stores the first result). */
  idempotencyKey: string;
};

export function submitClientForm({ token, selections, idempotencyKey }: SubmitVariables) {
  return apiRequest(
    `/api/v1/public/f/${encodeURIComponent(token)}/submissions`,
    dataOf(submissionSchema),
    {
      method: 'POST',
      body: { selections },
      headers: { 'Idempotency-Key': idempotencyKey },
    },
  );
}

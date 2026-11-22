import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@/lib/api-client';
import { clientFormKeys, submitClientForm, type SubmitVariables } from '../api/client-form.api';

/** What the client should read when sending fails, in the voice of S1. */
export function submitErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === 'FORM_LOCKED')
      return 'Your planner has closed this form, so it can no longer be changed.';
    if (error.status === 422)
      return 'Some services are no longer offered. Refresh the page and try again.';
    if (error.status === 429)
      return 'Too many tries in a short time. Wait a minute, then send again.';
    if (error.status === 404)
      return "This link isn't available. Ask your planner to send it again.";
  }
  return "We couldn't send your list. Check your connection and try again.";
}

export function useSubmitClientForm(token: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: Omit<SubmitVariables, 'token'>) =>
      submitClientForm({ ...variables, token }),
    // Safe: the same Idempotency-Key is reused, so a retry never submits twice.
    retry: (failureCount, error) => failureCount < 2 && !(error instanceof ApiError),
    // Refetching remounts the form with the saved answers, so never do it after an ordinary
    // failure: the client's unsent ticks must survive. A lock switches the page to the summary.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clientFormKeys.detail(token) }),
    onError: (error) =>
      error instanceof ApiError && error.code === 'FORM_LOCKED'
        ? queryClient.invalidateQueries({ queryKey: clientFormKeys.detail(token) })
        : undefined,
  });
}

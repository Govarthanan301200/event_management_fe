import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router';
import { ApiError } from '@/lib/api-client';
import { clientFormOptions } from '../api/client-form.api';
import { useSubmitClientForm } from '../hooks/use-submit-client-form';
import { ClientFormView } from './client-form-view';
import {
  ClientFormSkeleton,
  LinkUnavailable,
  LoadFailed,
  LockedSummary,
  ThankYou,
} from './client-form-states';

/** S1 · /f/:token — public, no login, mobile first. */
export function ClientFormPage() {
  const { token = '' } = useParams();
  return (
    <main className="mx-auto w-full max-w-[560px] px-4">
      {/* max-w = design token form-max (560px) */}
      <ClientFormContent key={token} token={token} />
    </main>
  );
}

type ClientFormContentProps = { token: string };

function ClientFormContent({ token }: ClientFormContentProps) {
  const query = useQuery(clientFormOptions(token));
  const submission = useSubmitClientForm(token);

  if (query.isPending) return <ClientFormSkeleton />;
  if (query.isError) {
    if (query.error instanceof ApiError && query.error.status === 404) return <LinkUnavailable />;
    return <LoadFailed onRetry={() => void query.refetch()} />;
  }

  const form = query.data;
  if (submission.isSuccess) {
    return (
      <ThankYou
        company={form.company}
        selectedCount={submission.data.selectedCount}
        onEdit={() => {
          submission.reset();
        }}
      />
    );
  }
  if (form.state === 'locked') return <LockedSummary form={form} />;
  // Remount on fresh data so the form's defaults are the latest saved answers.
  return <ClientFormView key={query.dataUpdatedAt} form={form} submission={submission} />;
}

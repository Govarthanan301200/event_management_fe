import { FormProvider } from 'react-hook-form';
import { formatDate } from '@/lib/format';
import { toSelections } from '../api/client-form.api';
import type { ClientForm } from '../api/client-form.schema';
import { useClientFormAnswers } from '../hooks/use-client-form-answers';
import { submitErrorMessage, type useSubmitClientForm } from '../hooks/use-submit-client-form';
import { CategorySection } from './category-section';
import { ClientFormHeader } from './client-form-header';
import { SubmitBar } from './submit-bar';

type ClientFormViewProps = {
  form: ClientForm;
  submission: ReturnType<typeof useSubmitClientForm>;
};

/** S1 open state: sections of tickable services and the sticky "Send to planner" bar. */
export function ClientFormView({ form, submission }: ClientFormViewProps) {
  const { methods, serviceOrder, totalSelected, selectedIn } = useClientFormAnswers(form);
  const rootError = methods.formState.errors.root?.message;
  const sendError = submission.isError ? submitErrorMessage(submission.error) : undefined;

  const onSubmit = methods.handleSubmit((answers) => {
    submission.mutate({
      selections: toSelections(answers, serviceOrder),
      idempotencyKey: crypto.randomUUID(),
    });
  });

  return (
    <FormProvider {...methods}>
      <form noValidate onSubmit={(event) => void onSubmit(event)} className="flex flex-col gap-8">
        <ClientFormHeader company={form.company} title="Plan your wedding">
          <p className="text-body-touch text-muted-foreground">
            Tick what you&apos;d like us to arrange. Add a note if something matters to you.
          </p>
          {form.submittedAt ? (
            <p className="rounded-md bg-muted px-3 py-2 text-label text-muted-foreground">
              You sent your list on {formatDate(form.submittedAt)}. Any changes you send now replace
              it.
            </p>
          ) : null}
        </ClientFormHeader>

        <div className="flex flex-col divide-y divide-border border-y border-border">
          {form.sections.map((section, index) => {
            const ids = section.services.map((service) => service.id);
            const count = selectedIn(ids);
            return (
              <CategorySection
                key={section.id}
                section={section}
                selectedCount={count}
                // First section, and any with earlier answers, start open.
                defaultOpen={index === 0 || form.selections.some((s) => ids.includes(s.serviceId))}
              />
            );
          })}
        </div>

        <SubmitBar
          companyName={form.company.name}
          selectedCount={totalSelected}
          pending={submission.isPending}
          message={rootError ?? sendError}
        />
      </form>
    </FormProvider>
  );
}

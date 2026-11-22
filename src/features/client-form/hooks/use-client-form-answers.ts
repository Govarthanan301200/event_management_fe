import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { answersSchema, type Answers, type ClientForm } from '../api/client-form.schema';

/** Previous answers pre-fill the form (spec §7 Resubmission). */
export function initialAnswers(form: ClientForm): Answers {
  const saved = new Map(
    form.selections.map((selection) => [selection.serviceId, selection.note ?? '']),
  );
  const services: Answers['services'] = {};
  for (const section of form.sections) {
    for (const service of section.services) {
      services[service.id] = { ticked: saved.has(service.id), note: saved.get(service.id) ?? '' };
    }
  }
  return { services };
}

export function countTicked(
  answers: Answers['services'] | undefined,
  serviceIds: readonly string[],
): number {
  return serviceIds.filter((id) => answers?.[id]?.ticked).length;
}

/** Owns the S1 form state: defaults from the server, validation, and live counts. */
export function useClientFormAnswers(form: ClientForm) {
  const methods = useForm<Answers>({
    resolver: zodResolver(answersSchema),
    defaultValues: initialAnswers(form),
  });
  const services = useWatch({ control: methods.control, name: 'services' });
  const allIds = form.sections.flatMap((section) => section.services.map((service) => service.id));

  return {
    methods,
    serviceOrder: allIds,
    totalSelected: countTicked(services, allIds),
    selectedIn: (serviceIds: readonly string[]) => countTicked(services, serviceIds),
  };
}

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import type { Catalogue } from '@/features/catalogue';
import type { EventFunction } from '@/features/events';
import { ApiError } from '@/lib/api-client';
import type { ServicePlan } from '../api/plan.schema';
import {
  lineFormSchema,
  toLineForm,
  toLineInput,
  untickWarnings,
  type LineForm,
  type ServiceContext,
} from '../lib/line-form';
import { serviceContext } from '../lib/plan-view';
import { useSaveLine } from './use-plan';

export type DrawerState =
  | { kind: 'add'; serviceId?: string | undefined; categoryId?: string | undefined }
  | { kind: 'edit'; lineId: string };

const NO_SERVICE: ServiceContext = { parameters: [], paxPrefill: false, sizeLabels: [] };

type Args = {
  eventId: string;
  functions: readonly EventFunction[];
  catalogue: Catalogue;
  plan: ServicePlan;
  state: DrawerState;
  onClose: () => void;
};

/** The S8 drawer's form state and actions (spec §11). The drawer components only render. */
export function useLineDrawer({ eventId, functions, catalogue, plan, state, onClose }: Args) {
  const line = state.kind === 'edit' ? plan.lines.find((l) => l.id === state.lineId) : undefined;
  const fnInfo = functions.map((fn) => ({ id: fn.id, name: fn.name, guestCount: fn.guestCount }));
  const startService = line?.serviceId ?? (state.kind === 'add' ? (state.serviceId ?? '') : '');
  const startContext = startService ? serviceContext(catalogue, startService) : null;
  const form = useForm<LineForm>({
    resolver: zodResolver(lineFormSchema()),
    defaultValues: toLineForm({
      categoryId:
        startContext?.categoryId ?? (state.kind === 'add' ? (state.categoryId ?? '') : ''),
      serviceId: startService,
      service: startContext ?? NO_SERVICE,
      functions: fnInfo,
      line,
    }),
  });
  // why: defaultValues set every field, so the watched values are a complete LineForm.
  const values = useWatch({ control: form.control }) as LineForm;
  const context = values.serviceId ? serviceContext(catalogue, values.serviceId) : null;
  const service = context ?? NO_SERVICE;
  const save = useSaveLine(eventId);

  /**
   * Choosing another service resets the rows for its parameters, keeping ticked functions and notes.
   * why setValue, not reset(): reset() drops the registered field refs, and with the React Compiler
   * memoising register() the inputs already on screen never re-register, so later setValue calls
   * (e.g. the rate suggestion's "Use") would not reach them.
   */
  const pickService = (serviceId: string) => {
    const next = serviceContext(catalogue, serviceId);
    const fresh = toLineForm({
      categoryId: next?.categoryId ?? values.categoryId,
      serviceId,
      service: next ?? NO_SERVICE,
      functions: fnInfo,
    });
    form.setValue('categoryId', fresh.categoryId);
    form.setValue('serviceId', serviceId);
    form.setValue('rows', fresh.rows);
    form.setValue('same', fresh.same);
    form.setValue('defaultVendorId', '');
    form.setValue('perFunctionVendor', false);
    form.clearErrors();
  };

  const pickCategory = (categoryId: string) => {
    form.setValue('categoryId', categoryId);
    form.setValue('serviceId', '');
  };

  const toggleFunction = (id: string) => {
    const ticked = values.functionIds.includes(id)
      ? values.functionIds.filter((f) => f !== id)
      : [...values.functionIds, id];
    form.setValue(
      'functionIds',
      fnInfo.map((fn) => fn.id).filter((f) => ticked.includes(f)),
      { shouldValidate: form.formState.isSubmitted },
    );
  };

  const setPerFunction = (on: boolean) => {
    form.setValue('perFunctionVendor', on);
    if (!on || values.defaultVendorId === '') return;
    // Spec §11 step 4: each row's vendor is pre-set to the line's vendor.
    for (const id of values.functionIds) {
      if (values.rows[id]?.vendorId === '')
        form.setValue(`rows.${id}.vendorId`, values.defaultVendorId);
    }
  };

  const submit = form.handleSubmit((submitted) => {
    if (!context) return;
    save.mutate(
      {
        lineId: line?.id ?? null,
        serviceId: submitted.serviceId,
        input: toLineInput(submitted, context, fnInfo),
      },
      {
        onSuccess: (saved) => {
          onClose();
          toast.success(
            line ? `${saved.serviceName} saved` : `${saved.serviceName} added to the plan`,
          );
        },
      },
    );
  });

  const knownVendors = new Map<string, string>();
  if (line?.defaultVendorId && line.defaultVendor)
    knownVendors.set(line.defaultVendorId, line.defaultVendor.name);
  for (const row of line?.rows ?? [])
    if (row.vendorId && row.vendor) knownVendors.set(row.vendorId, row.vendor.name);

  return {
    form,
    values,
    line,
    context,
    service,
    functions: fnInfo,
    save,
    /** The chosen service is already on the event (S8 opens that line instead). */
    duplicate: state.kind === 'add' && plan.lines.some((l) => l.serviceId === values.serviceId),
    /** A 409 from the server names the existing line (two saves racing). */
    conflictLineId:
      save.error instanceof ApiError && save.error.status === 409
        ? (save.error.details as { lineId?: string } | undefined)?.lineId
        : undefined,
    warnings: untickWarnings(line, values, service.parameters, fnInfo),
    knownVendors,
    pickService,
    pickCategory,
    toggleFunction,
    setPerFunction,
    submit,
  };
}

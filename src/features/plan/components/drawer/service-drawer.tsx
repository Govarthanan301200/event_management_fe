import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { Catalogue } from '@/features/catalogue';
import type { EventFunction } from '@/features/events';
import type { ServicePlan } from '../../api/plan.schema';
import { useLineDrawer, type DrawerState } from '../../hooks/use-line-drawer';
import { BudgetSection } from './budget-section';
import { DrawerFooter } from './drawer-footer';
import { FunctionChips } from './function-chips';
import { RowsEditor } from './rows-editor';
import { ServiceFields } from './service-fields';
import { VendorField } from './vendor-field';

export type { DrawerState } from '../../hooks/use-line-drawer';

type ServiceDrawerProps = {
  eventId: string;
  functions: readonly EventFunction[];
  catalogue: Catalogue;
  plan: ServicePlan;
  state: DrawerState;
  onOpenLine: (lineId: string) => void;
  onClose: () => void;
};

const PARAM_LABEL = {
  pax: 'Pax',
  hours: 'Hours',
  minutes: 'Minutes',
  size: 'Size',
  work: 'Work',
} as const;

/** S8 Add or edit service line (spec §11): a right-side drawer. Mount with a `key` per state. */
export function ServiceDrawer(props: ServiceDrawerProps) {
  const { catalogue, plan, onOpenLine, onClose } = props;
  const drawer = useLineDrawer(props);
  const { form, values, line, context, service, functions } = drawer;
  const { errors } = form.formState;

  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent
        side="right"
        className="w-full gap-0 rounded-l-lg p-0 shadow-overlay sm:max-w-drawer"
      >
        <SheetHeader className="border-b border-border px-6 py-5">
          <SheetTitle className="text-title-serif">
            {line ? `Edit ${line.serviceName}` : 'Add service'}
          </SheetTitle>
          <SheetDescription>
            Choose the functions it covers, one vendor, quantities and a budget.
          </SheetDescription>
        </SheetHeader>
        <form
          noValidate
          onSubmit={(e) => void drawer.submit(e)}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-6 py-5">
            {line ? null : (
              <ServiceFields
                catalogue={catalogue}
                plan={plan}
                categoryId={values.categoryId}
                serviceId={values.serviceId}
                parametersText={
                  context ? context.parameters.map((p) => PARAM_LABEL[p]).join(' · ') : null
                }
                error={errors.serviceId?.message}
                onCategory={drawer.pickCategory}
                onService={drawer.pickService}
                onOpenLine={onOpenLine}
              />
            )}
            <VendorField
              serviceId={values.serviceId}
              serviceName={context?.name ?? 'this service'}
              value={values.defaultVendorId}
              saved={
                line?.defaultVendorId && line.defaultVendor
                  ? { id: line.defaultVendorId, vendor: line.defaultVendor }
                  : null
              }
              perFunctionVendor={values.perFunctionVendor}
              onChange={(id) => {
                form.setValue('defaultVendorId', id, { shouldDirty: true });
              }}
              onPerFunctionVendor={drawer.setPerFunction}
            />
            <FunctionChips
              functions={functions}
              selected={values.functionIds}
              error={errors.functionIds?.message}
              onToggle={drawer.toggleFunction}
            />
            <RowsEditor
              form={form}
              values={values}
              service={service}
              functions={functions}
              knownVendors={drawer.knownVendors}
            />
            {drawer.warnings.length > 0 ? (
              <ul role="status" className="flex flex-col gap-1 text-label text-warning">
                {drawer.warnings.map((w) => (
                  <li key={w}>⚠ {w}</li>
                ))}
              </ul>
            ) : null}
            <BudgetSection form={form} values={values} service={service} functions={functions} />
          </div>
          <DrawerFooter
            error={drawer.save.error}
            conflictLineId={drawer.conflictLineId}
            saving={drawer.save.isPending}
            disabled={drawer.duplicate}
            onOpenLine={onOpenLine}
            onCancel={onClose}
          />
        </form>
      </SheetContent>
    </Sheet>
  );
}

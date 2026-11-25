import { useQuery } from '@tanstack/react-query';
import type { UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { vendorOptionsFor } from '../../api/plan.api';
import {
  fillFromSame,
  paxState,
  type FunctionInfo,
  type LineForm,
  type ServiceContext,
} from '../../lib/line-form';
import type { ParameterKey } from '../../lib/quantities';
import { QuantityInputs } from './quantity-inputs';
import { RowVendorCell } from './row-vendor-cell';
import { vendorLabel } from '../../lib/vendor-label';

type RowsEditorProps = {
  form: UseFormReturn<LineForm>;
  values: LineForm;
  service: ServiceContext;
  functions: readonly FunctionInfo[];
  /** The line's vendor names by id, for vendors no longer in the options. */
  knownVendors: ReadonlyMap<string, string>;
};

const LABEL: Record<ParameterKey, string> = {
  pax: 'Pax',
  hours: 'Hours',
  minutes: 'Minutes',
  size: 'Size',
  work: 'Work',
};

/**
 * S8 step 5 (spec §11): a row per ticked function, one input per parameter, an optional vendor per
 * row, and a budget per row. "Same for all" fills empty or pre-filled cells only.
 */
export function RowsEditor({ form, values, service, functions, knownVendors }: RowsEditorProps) {
  const options = useQuery({
    ...vendorOptionsFor(values.serviceId),
    enabled: values.perFunctionVendor,
  });
  const ticked = functions.filter((fn) => values.functionIds.includes(fn.id));
  const lineBudgetSet = values.lineBudget.trim() !== '';
  const errors = form.formState.errors.rows;
  if (ticked.length === 0) return null;

  const vendorItems = [
    ...(options.data ?? []).map((o) => ({ id: o.id, label: vendorLabel(o) })),
    ...[...knownVendors]
      .filter(([id]) => !(options.data ?? []).some((o) => o.id === id))
      .map(([id, name]) => ({ id, label: name })),
  ];

  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="w-full text-label">
        <thead className="bg-muted text-muted-foreground">
          <tr>
            <th className="px-2 py-2 text-left font-medium">Function</th>
            {values.perFunctionVendor ? (
              <th className="px-2 py-2 text-left font-medium">Vendor</th>
            ) : null}
            {service.parameters.map((key) => (
              <th key={key} className="px-2 py-2 text-left font-medium">
                {LABEL[key]}
              </th>
            ))}
            <th className="px-2 py-2 text-right font-medium">Budget (₹)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {service.parameters.length > 0 && ticked.length > 1 ? (
            <tr className="bg-muted/50">
              <td className="px-2 py-1.5 font-medium">Same for all</td>
              {values.perFunctionVendor ? <td /> : null}
              <SameForAllCells form={form} values={values} service={service} />
              <td className="px-2 py-1.5 text-right">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    form.setValue('rows', fillFromSame(values, service, functions), {
                      shouldDirty: true,
                    });
                  }}
                >
                  Fill
                </Button>
              </td>
            </tr>
          ) : null}
          {ticked.map((fn) => {
            const row = values.rows[fn.id];
            if (!row) return null;
            const changed =
              values.perFunctionVendor &&
              row.vendorId !== '' &&
              row.vendorId !== values.defaultVendorId;
            return (
              <tr key={fn.id}>
                <td className="px-2 py-1.5 align-top whitespace-nowrap">{fn.name}</td>
                {values.perFunctionVendor ? (
                  <RowVendorCell
                    control={form.control}
                    functionId={fn.id}
                    functionName={fn.name}
                    vendors={vendorItems}
                    changed={changed}
                  />
                ) : null}
                <RowCells form={form} values={values} service={service} fn={fn} />
                <td className="px-2 py-1.5 text-right align-top">
                  <Input
                    inputMode="numeric"
                    aria-label={`Budget for ${fn.name} (₹)`}
                    disabled={lineBudgetSet}
                    title={
                      lineBudgetSet
                        ? 'Clear the line budget to set budgets per function'
                        : undefined
                    }
                    className="ml-auto h-8 w-28 px-2 text-right tabular-nums"
                    {...form.register(`rows.${fn.id}.budget`)}
                  />
                  {errors?.[fn.id]?.budget ? (
                    <span className="text-caption text-danger">
                      ⚠ {errors[fn.id]?.budget?.message}
                    </span>
                  ) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

type CellsProps = { form: UseFormReturn<LineForm>; values: LineForm; service: ServiceContext };

function SameForAllCells({ form, values, service }: CellsProps) {
  return (
    <QuantityInputs
      register={form.register}
      prefix="same"
      rowLabel="Same for all"
      parameters={service.parameters}
      values={values.same}
      errors={undefined}
    />
  );
}

type RowCellsProps = CellsProps & { fn: FunctionInfo };

function RowCells({ form, values, service, fn }: RowCellsProps) {
  const row = values.rows[fn.id];
  if (!row) return null;
  return (
    <QuantityInputs
      register={form.register}
      prefix={`rows.${fn.id}`}
      rowLabel={fn.name}
      parameters={service.parameters}
      values={row}
      errors={form.formState.errors.rows?.[fn.id]}
      paxHint={paxState(service, row.pax, fn.guestCount)}
    />
  );
}

import { useQuery } from '@tanstack/react-query';
import type { UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { describeSuggestion, rateSuggestion } from '@/features/vendors';
import { formatINR } from '@/lib/format';
import { vendorOptionsFor } from '../../api/plan.api';
import type { VendorOption } from '../../api/plan.schema';
import {
  formTotal,
  suggestionRows,
  usesRowBudgets,
  type FunctionInfo,
  type LineForm,
  type ServiceContext,
} from '../../lib/line-form';

type BudgetSectionProps = {
  form: UseFormReturn<LineForm>;
  values: LineForm;
  service: ServiceContext;
  functions: readonly FunctionInfo[];
};

const grouped = new Intl.NumberFormat('en-IN');

/** The chosen vendor's rate for this service, if they have one (spec §9: rates are optional). */
function vendorRate(vendor: VendorOption | undefined) {
  if (vendor === undefined || vendor.rateAmount === null || vendor.rateBasis === null) return null;
  return { amount: vendor.rateAmount, basis: vendor.rateBasis };
}

/**
 * S8 steps 6 and 8 (spec §11): one line budget or budgets per function, never both; the vendor
 * rate's suggestion with "Use" (core rule 7: it never fills the budget by itself); notes.
 */
export function BudgetSection({ form, values, service, functions }: BudgetSectionProps) {
  const options = useQuery({
    ...vendorOptionsFor(values.serviceId),
    enabled: values.serviceId !== '',
  });
  const vendor = (options.data ?? []).find((o) => o.id === values.defaultVendorId);
  const rate = vendorRate(vendor);
  const suggestion = rateSuggestion(rate, suggestionRows(values, service, functions));
  const rowBudgets = usesRowBudgets(values);
  const error = form.formState.errors.lineBudget?.message;

  return (
    <div className="flex flex-col gap-4">
      <Field data-invalid={error ? true : undefined}>
        <FieldLabel htmlFor="line-budget">Line budget (₹)</FieldLabel>
        <Input
          id="line-budget"
          inputMode="numeric"
          placeholder="1,80,000"
          disabled={rowBudgets}
          className="w-40 tabular-nums"
          aria-invalid={error ? true : undefined}
          aria-describedby="line-budget-help"
          {...form.register('lineBudget')}
        />
        <FieldDescription id="line-budget-help">
          {rowBudgets
            ? 'Off while functions have their own budgets. Clear them to use one line budget.'
            : 'One budget for the whole line, or leave empty and budget each function above.'}
        </FieldDescription>
        {error ? <FieldError>{error}</FieldError> : null}
      </Field>

      {suggestion ? (
        <p className="flex flex-wrap items-center gap-2 rounded-sm bg-gold-soft px-3 py-2 text-label">
          Rate suggests <span className="tabular-nums">{formatINR(suggestion.amount)}</span>
          <span className="text-muted-foreground">({describeSuggestion(suggestion)})</span>
          <Button
            type="button"
            variant="link"
            size="sm"
            className="h-auto p-0"
            disabled={rowBudgets}
            onClick={() => {
              form.setValue('lineBudget', grouped.format(suggestion.amount), { shouldDirty: true });
            }}
          >
            Use
          </Button>
        </p>
      ) : null}

      <p className="flex items-baseline justify-between border-t border-border pt-3 text-body font-semibold">
        Total <span className="tabular-nums">{formatINR(formTotal(values, functions))}</span>
      </p>

      <Field>
        <FieldLabel htmlFor="line-notes">Notes (optional)</FieldLabel>
        <Textarea id="line-notes" rows={3} maxLength={2000} {...form.register('notes')} />
      </Field>
    </div>
  );
}

import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Catalogue } from '@/features/catalogue';
import type { ServicePlan } from '../../api/plan.schema';

type ServiceFieldsProps = {
  catalogue: Catalogue;
  plan: ServicePlan;
  categoryId: string;
  serviceId: string;
  /** Measured in, e.g. "Hours" or "Pax · Hours". */
  parametersText: string | null;
  error: string | undefined;
  onCategory: (categoryId: string) => void;
  onService: (serviceId: string) => void;
  onOpenLine: (lineId: string) => void;
};

/**
 * S8 step 1 (spec §11): category and service. A service already on the event offers to open
 * that line instead of creating a duplicate. Archived services can't be newly added.
 */
export function ServiceFields(props: ServiceFieldsProps) {
  const { catalogue, plan, categoryId, serviceId, error } = props;
  const categories = catalogue.categories.filter(
    (c) => !c.archivedAt && c.services.some((s) => !s.archivedAt),
  );
  const services = (categories.find((c) => c.id === categoryId)?.services ?? []).filter(
    (s) => !s.archivedAt,
  );
  const planned = new Map(plan.lines.map((line) => [line.serviceId, line.id]));
  const existing = serviceId ? planned.get(serviceId) : undefined;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field>
        <FieldLabel htmlFor="line-category">Category</FieldLabel>
        <Select value={categoryId} onValueChange={props.onCategory}>
          <SelectTrigger id="line-category" className="h-10 w-full">
            <SelectValue placeholder="Choose a category" />
          </SelectTrigger>
          <SelectContent position="popper">
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field data-invalid={error ? true : undefined}>
        <FieldLabel htmlFor="line-service">Service</FieldLabel>
        <Select value={serviceId} onValueChange={props.onService} disabled={categoryId === ''}>
          <SelectTrigger
            id="line-service"
            className="h-10 w-full"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? 'line-service-error' : undefined}
          >
            <SelectValue placeholder="Choose a service" />
          </SelectTrigger>
          <SelectContent position="popper">
            {services.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
                {planned.has(s.id) ? ' (planned)' : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {props.parametersText ? (
          <FieldDescription>Measured in {props.parametersText}</FieldDescription>
        ) : null}
        {error ? <FieldError id="line-service-error">{error}</FieldError> : null}
      </Field>
      {existing ? (
        <p role="status" className="flex flex-wrap items-center gap-2 text-label sm:col-span-2">
          This service is already planned for this event.
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              props.onOpenLine(existing);
            }}
          >
            Open it
          </Button>
        </p>
      ) : null}
    </div>
  );
}

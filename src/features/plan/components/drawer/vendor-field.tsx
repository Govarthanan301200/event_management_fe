import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { vendorOptionsFor } from '../../api/plan.api';
import type { VendorRef } from '../../api/plan.schema';
import { NO_VENDOR, vendorLabel } from '../../lib/vendor-label';
import { NewVendorDialog } from './new-vendor-dialog';

type VendorFieldProps = {
  serviceId: string;
  serviceName: string;
  value: string;
  /** The vendor saved on the line, kept even if archived or no longer offering the service. */
  saved: { id: string; vendor: VendorRef } | null;
  perFunctionVendor: boolean;
  onChange: (vendorId: string) => void;
  onPerFunctionVendor: (on: boolean) => void;
};

/** S8 step 2 and 4 (spec §11): the line's vendor, "+ New vendor", and the per-function toggle. */
export function VendorField(props: VendorFieldProps) {
  const { serviceId, value, saved } = props;
  const [creating, setCreating] = useState(false);
  const options = useQuery({ ...vendorOptionsFor(serviceId), enabled: serviceId !== '' });
  const list = options.data ?? [];
  const keepSaved = saved && !list.some((o) => o.id === saved.id) ? saved : null;
  const savedNote = keepSaved?.vendor.archived ? ' (archived)' : ' (no longer offers this service)';

  return (
    <div className="flex flex-col gap-3">
      <Field>
        <FieldLabel htmlFor="line-vendor">Vendor</FieldLabel>
        <div className="flex gap-2">
          <Select
            value={value === '' ? NO_VENDOR : value}
            onValueChange={(next) => {
              props.onChange(next === NO_VENDOR ? '' : next);
            }}
            disabled={serviceId === ''}
          >
            <SelectTrigger id="line-vendor" className="h-10 min-w-0 flex-1">
              <SelectValue
                placeholder={options.isPending && serviceId ? 'Loading…' : 'No vendor yet'}
              />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value={NO_VENDOR}>No vendor yet</SelectItem>
              {keepSaved ? (
                <SelectItem value={keepSaved.id}>
                  {keepSaved.vendor.name}
                  {savedNote}
                </SelectItem>
              ) : null}
              {list.length > 0 ? <SelectSeparator /> : null}
              {list.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {vendorLabel(option)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            className="h-10"
            disabled={serviceId === ''}
            onClick={() => {
              setCreating(true);
            }}
          >
            <Plus strokeWidth={1.5} aria-hidden="true" />
            New vendor
          </Button>
        </div>
        {serviceId !== '' && options.isSuccess && list.length === 0 ? (
          <FieldDescription>
            No vendor in your directory offers {props.serviceName} yet.
          </FieldDescription>
        ) : null}
        {options.isError ? (
          <FieldDescription>Couldn&apos;t load vendors. You can save without one.</FieldDescription>
        ) : null}
      </Field>
      <div className="flex w-fit items-center gap-3">
        <Switch
          id="line-per-function-vendor"
          checked={props.perFunctionVendor}
          onCheckedChange={props.onPerFunctionVendor}
          disabled={serviceId === ''}
        />
        <Label htmlFor="line-per-function-vendor" className="text-label font-normal">
          Different vendor per function
        </Label>
      </div>
      {creating ? (
        <NewVendorDialog
          serviceId={serviceId}
          serviceName={props.serviceName}
          onClose={() => {
            setCreating(false);
          }}
          onCreated={(vendorId) => {
            setCreating(false);
            props.onChange(vendorId);
          }}
        />
      ) : null}
    </div>
  );
}

import { Controller, type Control } from 'react-hook-form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { LineForm } from '../../lib/line-form';
import { Tag } from '../tag';

const LINE_VENDOR = '__default';

type RowVendorCellProps = {
  control: Control<LineForm>;
  functionId: string;
  functionName: string;
  vendors: readonly { id: string; label: string }[];
  /** The row's vendor differs from the line's (spec §11 acceptance: visibly tagged). */
  changed: boolean;
};

/** S8 step 4 (spec §11): a row's own vendor while "Different vendor per function" is on. */
export function RowVendorCell({
  control,
  functionId,
  functionName,
  vendors,
  changed,
}: RowVendorCellProps) {
  return (
    <td className="px-2 py-1.5 align-top">
      <Controller
        control={control}
        name={`rows.${functionId}.vendorId`}
        render={({ field }) => (
          <Select
            value={field.value || LINE_VENDOR}
            onValueChange={(v) => {
              field.onChange(v === LINE_VENDOR ? '' : v);
            }}
          >
            <SelectTrigger aria-label={`Vendor for ${functionName}`} size="sm" className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value={LINE_VENDOR}>Line vendor</SelectItem>
              {vendors.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
      {changed ? <Tag tone="warning">changed</Tag> : null}
    </td>
  );
}

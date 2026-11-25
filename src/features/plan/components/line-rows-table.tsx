import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { EventFunction } from '@/features/events';
import { formatINR } from '@/lib/format';
import type { ServiceLine } from '../api/plan.schema';
import { formatQuantity, type ParameterKey } from '../lib/quantities';
import { Tag } from './tag';

type LineRowsTableProps = {
  line: ServiceLine;
  parameters: readonly ParameterKey[];
  paxPrefill: boolean;
  functions: readonly EventFunction[];
};

const LABEL: Record<ParameterKey, string> = {
  pax: 'Pax',
  hours: 'Hours',
  minutes: 'Minutes',
  size: 'Size',
  work: 'Work',
};

/** The expanded S7 line: one row per covered function (spec §11 wireframe). */
export function LineRowsTable({ line, parameters, paxPrefill, functions }: LineRowsTableProps) {
  const names = new Map(functions.map((fn) => [fn.id, fn.name]));
  const showVendor = line.perFunctionVendor || line.defaultVendor !== null;

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="text-label text-muted-foreground">Function</TableHead>
            {showVendor ? (
              <TableHead className="text-label text-muted-foreground">Vendor</TableHead>
            ) : null}
            {parameters.map((key) => (
              <TableHead key={key} className="text-label text-muted-foreground">
                {LABEL[key]}
              </TableHead>
            ))}
            <TableHead className="text-right text-label text-muted-foreground">Budget</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {line.rows.map((row) => {
            const changed =
              line.perFunctionVendor &&
              row.vendorId !== null &&
              row.vendorId !== line.defaultVendorId;
            const vendorName = changed ? row.vendor?.name : line.defaultVendor?.name;
            return (
              <TableRow key={row.id}>
                <TableCell className="text-label">
                  {names.get(row.eventFunctionId) ?? 'Function'}
                </TableCell>
                {showVendor ? (
                  <TableCell className="text-label">
                    <span className="flex items-center gap-1.5">
                      {vendorName ?? <span className="text-muted-foreground">None yet</span>}
                      {changed ? <Tag tone="warning">changed</Tag> : null}
                    </span>
                  </TableCell>
                ) : null}
                {parameters.map((key) => (
                  <TableCell key={key} className="text-label tabular-nums">
                    <span className="flex items-center gap-1.5">
                      {formatQuantity(key, row.quantities) ?? (
                        <span className="text-muted-foreground">—</span>
                      )}
                      {key === 'pax' && paxPrefill && !row.paxEdited ? (
                        <span className="text-muted-foreground">(guests)</span>
                      ) : null}
                      {key === 'pax' && row.paxEdited ? <Tag tone="warning">edited</Tag> : null}
                    </span>
                  </TableCell>
                ))}
                <TableCell className="text-right text-label tabular-nums">
                  {row.budget === null ? (
                    <span className="text-muted-foreground">—</span>
                  ) : (
                    formatINR(row.budget)
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

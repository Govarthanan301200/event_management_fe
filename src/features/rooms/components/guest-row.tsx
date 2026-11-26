import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import type { GuestRow, Hotel } from '../api/rooms.schema';
import { cellValue } from '../lib/cell-edit';
import { COLUMNS, type ColumnKey } from '../lib/columns';
import { GridCell } from './grid-cell';

type GuestRowViewProps = {
  row: GuestRow;
  rowIndex: number;
  hotels: readonly Hotel[];
  selected: boolean;
  onSelect: (select: boolean) => void;
  /** Saves one cell; false when the text can't be saved (the cell shows the saved value). */
  onSave: (row: GuestRow, key: ColumnKey, text: string) => boolean;
};

/** One guest row: a select box, then an input per column. */
export function GuestRowView({
  row,
  rowIndex,
  hotels,
  selected,
  onSelect,
  onSave,
}: GuestRowViewProps) {
  const who = row.name;
  return (
    <tr data-row-id={row.id} className={cn(selected && '[&>td]:bg-gold-soft')}>
      <td className="sticky left-0 z-10 w-10 border-b border-border bg-card px-3">
        <Checkbox
          aria-label={`Select ${who}`}
          checked={selected}
          onCheckedChange={(checked) => {
            onSelect(checked === true);
          }}
        />
      </td>
      {COLUMNS.map((column, colIndex) => (
        <GridCell
          key={column.key}
          column={column}
          value={cellValue(row, column.key)}
          hotels={hotels}
          label={column.key === 'name' ? `Name of ${who}` : `${column.title} for ${who}`}
          rowIndex={rowIndex}
          colIndex={colIndex}
          sticky={colIndex === 0}
          onCommit={(text) => onSave(row, column.key, text)}
        />
      ))}
    </tr>
  );
}

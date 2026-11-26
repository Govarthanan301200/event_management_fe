import { useState, type KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';
import type { Hotel } from '../api/rooms.schema';
import type { Column } from '../lib/columns';
import { STATUS_LABELS } from '../lib/status';

type GridCellProps = {
  column: Column;
  /** What the stored value reads as in the input ('' for none). */
  value: string;
  hotels: readonly Hotel[];
  /** "Room No for Lakshmi R": the input's accessible name. */
  label: string;
  rowIndex: number;
  colIndex: number;
  /**
   * Called with the input's text when it changed (blur or Enter; a select on pick). Returns false
   * when the text can't be saved (an empty name); either way the cell then shows the saved value.
   */
  onCommit: (text: string) => boolean;
  sticky?: boolean;
};

const inputClass =
  'h-12 w-full min-w-0 bg-transparent px-2 text-body outline-none sm:h-10 placeholder:text-muted-foreground';

/** Moves focus to the same column in another row (Enter and ↑/↓, as in a spreadsheet). */
function focusRow(from: HTMLElement, rowIndex: number, colIndex: number): boolean {
  const grid = from.closest('[data-rooms-grid]');
  const target = grid?.querySelector<HTMLElement>(
    `[data-cell="${String(rowIndex)}:${String(colIndex)}"]`,
  );
  target?.focus();
  return target !== null && target !== undefined;
}

/**
 * One S14 cell: every cell is an input (spec §10 "inline editing of every cell"). Text saves on
 * blur or Enter; Esc puts the saved value back. While typing, the cell shows its draft (UI state);
 * after that it always shows the saved value, so a refused or rolled-back save shows the truth. Dates use a date input; Hotel and Status are
 * native selects, which save when picked. Native selects, not Radix: a sheet can hold 2,000 rows × 2
 * of them, and the native control is fast and accessible.
 */
export function GridCell({
  column,
  value,
  hotels,
  label,
  rowIndex,
  colIndex,
  onCommit,
  sticky = false,
}: GridCellProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const cell = `${String(rowIndex)}:${String(colIndex)}`;
  const tdClass = cn(
    'border-b border-border p-0 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-gold',
    column.kind === 'count' && 'text-right',
    sticky && 'sticky left-10 z-10 bg-card',
  );

  if (column.kind === 'hotel' || column.kind === 'status') {
    return (
      <td className={tdClass}>
        <select
          aria-label={label}
          data-cell={cell}
          value={value}
          onChange={(event) => {
            onCommit(event.target.value);
          }}
          className={cn(inputClass, 'cursor-pointer')}
        >
          <option value="">—</option>
          {column.kind === 'hotel'
            ? hotels.map((hotel) => (
                <option key={hotel.id} value={hotel.id}>
                  {hotel.name}
                </option>
              ))
            : Object.entries(STATUS_LABELS).map(([key, text]) => (
                <option key={key} value={key}>
                  {text}
                </option>
              ))}
        </select>
      </td>
    );
  }

  const commit = () => {
    if (draft !== null && draft !== value) onCommit(draft);
    setDraft(null);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    if (event.key === 'Escape') {
      setDraft(null);
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      // Leaving the cell saves it (onBlur), once; on the last row there is nowhere to go.
      if (!focusRow(input, rowIndex + 1, colIndex)) input.blur();
      return;
    }
    if (column.kind !== 'date' && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      event.preventDefault();
      focusRow(input, rowIndex + (event.key === 'ArrowDown' ? 1 : -1), colIndex);
    }
  };

  return (
    <td className={tdClass}>
      <input
        aria-label={label}
        data-cell={cell}
        value={draft ?? value}
        onChange={(event) => {
          setDraft(event.target.value);
        }}
        type={column.kind === 'date' ? 'date' : 'text'}
        inputMode={column.kind === 'count' ? 'numeric' : undefined}
        maxLength={column.max}
        onKeyDown={onKeyDown}
        onBlur={commit}
        className={cn(inputClass, column.kind === 'count' && 'text-right tabular-nums')}
      />
    </td>
  );
}

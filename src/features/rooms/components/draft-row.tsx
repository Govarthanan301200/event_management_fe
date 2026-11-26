import { useState } from 'react';
import type { GuestRowInput, Hotel } from '../api/rooms.schema';
import { cellChange } from '../lib/cell-edit';
import { COLUMNS, type ColumnKey } from '../lib/columns';
import { GridCell } from './grid-cell';

type DraftRowProps = {
  rowIndex: number;
  hotels: readonly Hotel[];
  /** Saves the row once it has a name (spec §10: Name is required). */
  onAdd: (row: GuestRowInput) => void;
  onInvalid: (message: string) => void;
};

/**
 * "+ Add row": a new row at the bottom, kept on screen until its name is typed; then it is saved
 * with everything typed so far (decision 2026-11-27). Its values are UI state until then.
 */
export function DraftRow({ rowIndex, hotels, onAdd, onInvalid }: DraftRowProps) {
  const [text, setText] = useState<Partial<Record<ColumnKey, string>>>({});

  const commit = (key: ColumnKey, value: string): boolean => {
    const result = cellChange(key, value);
    if (!result.ok && key !== 'name') {
      onInvalid(result.message);
      return false;
    }
    const next = { ...text, [key]: value };
    setText(next);
    if (key !== 'name' || value.trim() === '') return true;
    const row: Partial<GuestRowInput> = {};
    for (const [field, typed] of Object.entries(next) as [ColumnKey, string][]) {
      const change = cellChange(field, typed);
      if (change.ok) Object.assign(row, change.change);
    }
    onAdd({ ...row, name: value.trim() });
    return true;
  };

  return (
    <tr data-draft-row className="[&>td]:bg-muted/40">
      <td className="sticky left-0 z-10 w-10 border-b border-border bg-card px-3">
        <span className="sr-only">New row</span>
      </td>
      {COLUMNS.map((column, colIndex) => (
        <GridCell
          key={column.key}
          column={column}
          value={text[column.key] ?? ''}
          hotels={hotels}
          label={`${column.title} for the new row`}
          rowIndex={rowIndex}
          colIndex={colIndex}
          sticky={colIndex === 0}
          onCommit={(value) => commit(column.key, value)}
        />
      ))}
    </tr>
  );
}

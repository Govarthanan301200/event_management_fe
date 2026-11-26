import { useIsMutating, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { errorMessage } from '@/lib/api-client';
import { addRows, deleteRows, importRows, roomsKeys, updateRow } from '../api/rooms.api';
import type {
  GuestRow,
  GuestRowInput,
  GuestValues,
  ImportRowInput,
  Rooms,
} from '../api/rooms.schema';
import { cellChange } from '../lib/cell-edit';
import { columnOf, type ColumnKey } from '../lib/columns';

type SaveCell = {
  rowId: string;
  change: Partial<GuestValues>;
  label: string;
  /** The table before this change, for the rollback. */
  before: Rooms | undefined;
};

/**
 * S14 row changes (spec §10 "Saves automatically"). A cell saves on its own, optimistically, and
 * rolls back with a toast if the server refuses. Adds, pastes, imports and deletes update the
 * table from the server's answer.
 */
export function useGuestRows(eventId: string) {
  const queryClient = useQueryClient();
  const key = roomsKeys.event(eventId);
  const setRooms = (update: (rooms: Rooms) => Rooms) => {
    queryClient.setQueryData<Rooms>(key, (rooms) => (rooms ? update(rooms) : rooms));
  };

  const saveCell = useMutation({
    mutationKey: roomsKeys.save(eventId),
    mutationFn: ({ rowId, change }: SaveCell) => updateRow(eventId, rowId, change),
    onError: (error, variables) => {
      if (variables.before) queryClient.setQueryData(key, variables.before);
      toast.error(errorMessage(error, `Couldn't save ${variables.label}.`), {
        action: {
          label: 'Retry',
          onClick: () => {
            saveCell.mutate(variables);
          },
        },
      });
    },
    onSuccess: (saved) => {
      setRooms((rooms) => ({
        ...rooms,
        rows: rooms.rows.map((row) => (row.id === saved.id ? saved : row)),
      }));
    },
  });

  const addRow = useMutation({
    mutationKey: roomsKeys.save(eventId),
    mutationFn: (row: GuestRowInput) => addRows(eventId, [row]),
    onSuccess: (added) => {
      setRooms((rooms) => ({ ...rooms, rows: [...rooms.rows, ...added] }));
    },
    onError: (error) => {
      toast.error(errorMessage(error, "Couldn't add the row."));
    },
  });

  const remove = useMutation({
    mutationFn: (ids: string[]) => deleteRows(eventId, ids),
    onSuccess: (_result, ids) => {
      const gone = new Set(ids);
      setRooms((rooms) => ({ ...rooms, rows: rooms.rows.filter((row) => !gone.has(row.id)) }));
    },
  });

  /** Paste and XLSX import: rows with hotel names; unknown hotels join the list. */
  const importMany = useMutation({
    mutationKey: roomsKeys.save(eventId),
    mutationFn: (input: { rows: ImportRowInput[]; replace: boolean; key: string }) =>
      importRows(eventId, { rows: input.rows, replace: input.replace }, input.key),
    onSuccess: ({ hotels, rows }) => {
      queryClient.setQueryData<Rooms>(key, { hotels, rows });
    },
  });

  /** A pasted block appends rows (decision 2026-11-27), with Undo for 5 seconds. */
  const paste = (rows: ImportRowInput[]) => {
    const before = new Set((queryClient.getQueryData<Rooms>(key)?.rows ?? []).map((row) => row.id));
    importMany.mutate(
      { rows, replace: false, key: crypto.randomUUID() },
      {
        onSuccess: (result) => {
          const added = result.rows
            .filter((row: GuestRow) => !before.has(row.id))
            .map((row) => row.id);
          toast.success(added.length === 1 ? 'Added 1 row' : `Added ${String(added.length)} rows`, {
            duration: 5000,
            action: {
              label: 'Undo',
              onClick: () => {
                remove.mutate(added);
              },
            },
          });
        },
        onError: (error) => {
          toast.error(errorMessage(error, "Couldn't add the pasted rows."));
        },
      },
    );
  };

  /** A typed cell → its field, saved; false (with a toast) when it can't be saved. */
  const saveText = (row: GuestRow, column: ColumnKey, text: string): boolean => {
    const result = cellChange(column, text);
    if (!result.ok) {
      toast.error(result.message);
      return false;
    }
    // Optimistic, and synchronous: the cell shows the new value in the same render it commits.
    void queryClient.cancelQueries({ queryKey: key });
    const before = queryClient.getQueryData<Rooms>(key);
    setRooms((rooms) => ({
      ...rooms,
      rows: rooms.rows.map((item) => (item.id === row.id ? { ...item, ...result.change } : item)),
    }));
    saveCell.mutate({
      rowId: row.id,
      change: result.change,
      label: `${columnOf(column).title} for ${row.name}`,
      before,
    });
    return true;
  };

  const saving = useIsMutating({ mutationKey: roomsKeys.save(eventId) }) > 0;

  return { saveCell, saveText, addRow, remove, importMany, paste, saving };
}

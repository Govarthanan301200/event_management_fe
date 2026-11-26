import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import type { Hotel, Rooms } from '../api/rooms.schema';
import { useGuestRows } from '../hooks/use-guest-rows';
import { usePasteRows } from '../hooks/use-paste-rows';
import { exportFileName } from '../lib/export';
import { useRoomsView } from '../hooks/use-rooms-view';
import { nextSort } from '../lib/view';
import { writeXlsx } from '../lib/xlsx';
import { DeleteRowsDialog } from './delete-rows-dialog';
import { DraftRow } from './draft-row';
import { GuestGrid } from './guest-grid';
import { GuestRowView } from './guest-row';
import { HotelDialog } from './hotel-dialog';
import { HotelsBar } from './hotels-bar';
import { ImportDialog } from './import-dialog';
import { RoomsFilters } from './rooms-filters';
import { RoomsHeader } from './rooms-header';

type Open = { kind: 'hotel'; hotel: Hotel | null } | { kind: 'import' } | { kind: 'delete' } | null;

type RoomsSheetProps = { eventId: string; eventName: string; rooms: Rooms };

/**
 * The S14 sheet: hotels, filters, the grid and its dialogs. Filters and sort live in the URL;
 * selection and the new row are UI state.
 */
export function RoomsSheet({ eventId, eventName, rooms }: RoomsSheetProps) {
  const { view, setView, shown, shownIds } = useRoomsView(rooms);
  const actions = useGuestRows(eventId);
  const [open, setOpen] = useState<Open>(null);
  const [adding, setAdding] = useState(false);
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  usePasteRows(rooms.hotels, actions.paste);
  const selectedShown = shownIds.filter((id) => selected.has(id));

  const exportRows = () => {
    const hotel = rooms.hotels.find((item) => item.id === view.hotel);
    void writeXlsx(shown, rooms.hotels, exportFileName(eventName, hotel?.name)).catch(() => {
      toast.error("Couldn't write the file. Try again.");
    });
  };

  return (
    <>
      <RoomsHeader
        rowCount={rooms.rows.length}
        saving={actions.saving}
        canExport={shown.length > 0}
        adding={adding}
        onImport={() => {
          setOpen({ kind: 'import' });
        }}
        onExport={exportRows}
        onAdd={() => {
          setAdding(true);
          requestAnimationFrame(() => {
            document.querySelector<HTMLElement>('[data-draft-row] [data-cell$=":4"]')?.focus();
          });
        }}
      />

      <HotelsBar
        hotels={rooms.hotels}
        onOpen={(hotel) => {
          setOpen({ kind: 'hotel', hotel });
        }}
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <RoomsFilters
          view={view}
          hotels={rooms.hotels}
          onChange={(key, value) => {
            setView({ [key]: value });
          }}
          onClear={() => {
            setView({ q: null, hotel: null, status: null });
          }}
        />
        {selectedShown.length > 0 ? (
          <Button
            variant="outline"
            className="h-9 px-3 text-danger hover:bg-danger-soft hover:text-danger"
            onClick={() => {
              setOpen({ kind: 'delete' });
            }}
          >
            Delete {selectedShown.length === 1 ? '1 row' : `${String(selectedShown.length)} rows`}
          </Button>
        ) : null}
      </div>

      {rooms.rows.length === 0 && !adding ? (
        <EmptyRooms />
      ) : (
        <GuestGrid
          view={view}
          onSort={(key) => {
            setView(nextSort(view, key));
          }}
          shownIds={shownIds}
          selected={selected}
          onSelectAll={(select) => {
            setSelected(select ? new Set(shownIds) : new Set());
          }}
          hotels={rooms.hotels}
        >
          {shown.map((row, index) => (
            <GuestRowView
              key={row.id}
              row={row}
              rowIndex={index}
              hotels={rooms.hotels}
              selected={selected.has(row.id)}
              onSelect={(select) => {
                setSelected((current) => {
                  const next = new Set(current);
                  if (select) next.add(row.id);
                  else next.delete(row.id);
                  return next;
                });
              }}
              onSave={actions.saveText}
            />
          ))}
          {adding ? (
            <DraftRow
              rowIndex={shown.length}
              hotels={rooms.hotels}
              onInvalid={(message) => {
                toast.error(message);
              }}
              onAdd={(row) => {
                actions.addRow.mutate(row, {
                  onSuccess: ([added]) => {
                    setAdding(false);
                    if (!added) return;
                    // Carry on where the planner was: the cell after Name in the saved row.
                    requestAnimationFrame(() => {
                      document
                        .querySelector<HTMLElement>(`[data-row-id="${added.id}"] [data-cell$=":5"]`)
                        ?.focus();
                    });
                  },
                });
              }}
            />
          ) : null}
        </GuestGrid>
      )}
      {shown.length === 0 && rooms.rows.length > 0 ? (
        <p className="text-body text-muted-foreground">No rows match these filters.</p>
      ) : null}

      {open?.kind === 'hotel' ? (
        <HotelDialog
          eventId={eventId}
          hotel={open.hotel}
          usedBy={
            rooms.rows.filter((row) => open.hotel !== null && row.eventHotelId === open.hotel.id)
              .length
          }
          onClose={() => {
            setOpen(null);
          }}
        />
      ) : null}
      {open?.kind === 'import' ? (
        <ImportDialog
          hotels={rooms.hotels}
          existingRows={rooms.rows.length}
          importMany={actions.importMany}
          onClose={() => {
            actions.importMany.reset();
            setOpen(null);
          }}
        />
      ) : null}
      {open?.kind === 'delete' ? (
        <DeleteRowsDialog
          ids={selectedShown}
          remove={actions.remove}
          onClose={(deleted) => {
            if (deleted) setSelected(new Set());
            setOpen(null);
          }}
        />
      ) : null}
    </>
  );
}

/** Spec design system: an invitation, one sentence of help. A paste works here too. */
function EmptyRooms() {
  return (
    <div className="flex flex-col items-start gap-2 rounded-md border border-dashed border-border px-6 py-12">
      <h3 className="text-title-serif">Add your first guest</h3>
      <p className="text-body text-muted-foreground">
        Paste rows copied from Excel or Google Sheets, import a sheet, or add rows one by one.
      </p>
    </div>
  );
}

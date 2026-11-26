import { Download, Plus, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

type RoomsHeaderProps = {
  rowCount: number;
  saving: boolean;
  canExport: boolean;
  adding: boolean;
  onImport: () => void;
  onExport: () => void;
  onAdd: () => void;
};

/** The wireframe's top line: the count and autosave state, then Import, Export and Add row. */
export function RoomsHeader({
  rowCount,
  saving,
  canExport,
  adding,
  onImport,
  onExport,
  onAdd,
}: RoomsHeaderProps) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-title-serif font-display">Rooms and guests</h2>
        <p className="text-caption text-muted-foreground">
          <span className="tabular-nums">{rowCount}</span>{' '}
          {rowCount === 1 ? 'guest row' : 'guest rows'} ·{' '}
          <span role="status">{saving ? 'Saving…' : 'Saves automatically'}</span>
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" className="h-10 gap-2 px-3" onClick={onImport}>
          <Upload className="size-4" strokeWidth={1.5} aria-hidden="true" />
          Import XLSX
        </Button>
        <Button
          variant="outline"
          className="h-10 gap-2 px-3"
          disabled={!canExport}
          onClick={onExport}
        >
          <Download className="size-4" strokeWidth={1.5} aria-hidden="true" />
          Export XLSX
        </Button>
        <Button className="h-10 gap-2 px-4" disabled={adding} onClick={onAdd}>
          <Plus className="size-4" strokeWidth={1.5} aria-hidden="true" />
          Add row
        </Button>
      </div>
    </header>
  );
}

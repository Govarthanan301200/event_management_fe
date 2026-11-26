import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { errorMessage } from '@/lib/api-client';
import type { Hotel } from '../api/rooms.schema';
import type { useGuestRows } from '../hooks/use-guest-rows';
import { readXlsx } from '../lib/xlsx';
import { rowsFromSheet, type SheetPlan } from '../lib/sheet';
import { plural } from '../lib/preview';
import { ImportPreview } from './import-preview';

type ImportDialogProps = {
  hotels: readonly Hotel[];
  existingRows: number;
  importMany: ReturnType<typeof useGuestRows>['importMany'];
  onClose: () => void;
};

type Step =
  { kind: 'pick'; error: string | null } | { kind: 'preview'; fileName: string; plan: SheetPlan };

/**
 * XLSX import (spec §10; decision 2026-11-27): pick a file, see what it holds, then append, or
 * replace the rows with "Replace existing rows". The file is read in the browser; only rows travel.
 */
export function ImportDialog({ hotels, existingRows, importMany, onClose }: ImportDialogProps) {
  const [step, setStep] = useState<Step>({ kind: 'pick', error: null });
  const [replace, setReplace] = useState(false);
  // One key per dialog: a double click or a retry after a lost answer imports once.
  const [key] = useState(() => crypto.randomUUID());

  const read = async (file: File) => {
    try {
      const plan = rowsFromSheet(await readXlsx(file), hotels);
      if (plan.rows.length === 0) {
        setStep({ kind: 'pick', error: 'No rows with a name were found in that sheet.' });
        return;
      }
      setStep({ kind: 'preview', fileName: file.name, plan });
    } catch {
      setStep({
        kind: 'pick',
        error: "That file couldn't be read. Save it as .xlsx and try again.",
      });
    }
  };

  const plan = step.kind === 'preview' ? step.plan : null;

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-title-serif">Import rooms and guests</DialogTitle>
          <DialogDescription>
            An .xlsx sheet with a header row (G ID, Name, Hotel, …) or columns in this table&apos;s
            order. Hotels not on this event&apos;s list are added.
          </DialogDescription>
        </DialogHeader>
        {step.kind === 'pick' ? (
          <div className="flex flex-col gap-2">
            <Label htmlFor="rooms-file">Sheet</Label>
            <input
              id="rooms-file"
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              aria-describedby={step.error ? 'rooms-file-error' : undefined}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void read(file);
              }}
              className="text-body file:mr-3 file:h-9 file:rounded-sm file:border file:border-input file:bg-card file:px-3 file:text-label"
            />
            {step.error ? (
              <p id="rooms-file-error" role="alert" className="text-label text-danger">
                ⚠ {step.error}
              </p>
            ) : null}
          </div>
        ) : null}
        {plan && step.kind === 'preview' ? (
          <div className="flex flex-col gap-4">
            <ImportPreview fileName={step.fileName} plan={plan} />
            {existingRows > 0 ? (
              <div className="flex items-start gap-3">
                <Checkbox
                  id="rooms-replace"
                  checked={replace}
                  onCheckedChange={(checked) => {
                    setReplace(checked === true);
                  }}
                  aria-describedby="rooms-replace-help"
                />
                <div className="flex flex-col gap-0.5">
                  <Label htmlFor="rooms-replace" className="text-body font-normal">
                    Replace existing rows
                  </Label>
                  <p id="rooms-replace-help" className="text-caption text-muted-foreground">
                    Removes the {plural(existingRows, 'row', 'rows')} in the table first. Hotels
                    stay.
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
        {importMany.isError ? (
          <p role="alert" className="text-label text-danger">
            ⚠ {errorMessage(importMany.error, "Couldn't import the rows. Try again.")}
          </p>
        ) : null}
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            className="h-10 px-4"
            disabled={plan === null || importMany.isPending}
            onClick={() => {
              if (!plan) return;
              importMany.mutate(
                { rows: plan.rows, replace, key },
                {
                  onSuccess: (result) => {
                    onClose();
                    toast.success(`Imported ${plural(result.added, 'row', 'rows')}`);
                  },
                },
              );
            }}
          >
            {importMany.isPending
              ? 'Importing…'
              : plan
                ? `Import ${plural(plan.rows.length, 'row', 'rows')}`
                : 'Import'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

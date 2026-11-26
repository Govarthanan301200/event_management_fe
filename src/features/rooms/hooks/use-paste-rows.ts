import { useEffect, useEffectEvent } from 'react';
import { toast } from 'sonner';
import type { Hotel, ImportRowInput } from '../api/rooms.schema';
import { isBlockPaste, parseClipboard, rowsFromSheet } from '../lib/sheet';

/** Where a pasted block becomes rows: the sheet itself, or the page with nothing focused. */
function pasteTarget(target: EventTarget | null): 'grid' | 'page' | null {
  if (!(target instanceof Element) || target === document.body) return 'page';
  if (target.closest('[role="dialog"], [role="alertdialog"]')) return null;
  if (target.closest('[data-rooms-grid]')) return 'grid';
  return target.closest('input, textarea, select, [contenteditable="true"]') ? null : 'page';
}

/**
 * Spec §10 "Paste a block of rows copied from Excel or Google Sheets; columns map in order"
 * (decision 2026-11-27): a block (a tab or a line break) appends rows; a single value pastes into
 * the cell being edited as usual. A document listener, because the page itself has focus when the
 * sheet is empty.
 */
export function usePasteRows(hotels: readonly Hotel[], paste: (rows: ImportRowInput[]) => void) {
  const onPaste = useEffectEvent((event: ClipboardEvent) => {
    const where = pasteTarget(event.target);
    const text = event.clipboardData?.getData('text/plain') ?? '';
    if (where === null || !isBlockPaste(text)) return;
    event.preventDefault();
    const plan = rowsFromSheet(parseClipboard(text), hotels);
    if (plan.rows.length === 0) {
      toast.error('No rows with a name were found in what you pasted.');
      return;
    }
    if (plan.skippedNoName > 0) {
      toast(
        `${plan.skippedNoName === 1 ? '1 row' : `${String(plan.skippedNoName)} rows`} without a name skipped`,
      );
    }
    paste(plan.rows);
  });

  useEffect(() => {
    document.addEventListener('paste', onPaste);
    return () => {
      document.removeEventListener('paste', onPaste);
    };
  }, []);
}

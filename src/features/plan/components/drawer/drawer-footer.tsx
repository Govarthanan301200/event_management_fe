import { Button } from '@/components/ui/button';
import { errorMessage } from '@/lib/api-client';

type DrawerFooterProps = {
  error: unknown;
  conflictLineId: string | undefined;
  saving: boolean;
  disabled: boolean;
  onOpenLine: (lineId: string) => void;
  onCancel: () => void;
};

/** S8 sticky footer: save errors (with "Open it" for a duplicate), Cancel and Save service. */
export function DrawerFooter({
  error,
  conflictLineId,
  saving,
  disabled,
  onOpenLine,
  onCancel,
}: DrawerFooterProps) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border bg-card px-6 py-4">
      {error ? (
        <p
          role="alert"
          className="mr-auto flex flex-wrap items-center gap-2 text-label text-danger"
        >
          ⚠ {errorMessage(error, "Couldn't save the service. Try again.")}
          {conflictLineId ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                onOpenLine(conflictLineId);
              }}
            >
              Open it
            </Button>
          ) : null}
        </p>
      ) : null}
      <Button type="button" variant="ghost" className="h-10 px-4" onClick={onCancel}>
        Cancel
      </Button>
      <Button type="submit" className="h-10 px-4" disabled={saving || disabled}>
        {saving ? 'Saving…' : 'Save service'}
      </Button>
    </div>
  );
}

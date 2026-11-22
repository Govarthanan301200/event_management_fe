import { Button } from '@/components/ui/button';

type SubmitBarProps = {
  companyName: string;
  selectedCount: number;
  pending: boolean;
  /** Form-level problem (nothing ticked, or sending failed). */
  message: string | undefined;
};

/**
 * Sticky bottom bar: privacy line, total selected and the one primary action (design system: S1).
 * The arbitrary bottom padding keeps the button above the iPhone home indicator (safe-area inset).
 */
export function SubmitBar({ companyName, selectedCount, pending, message }: SubmitBarProps) {
  return (
    <div
      data-sticky-footer
      className="sticky bottom-0 -mx-4 border-t border-border bg-card px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-sticky"
    >
      {message ? (
        <p role="alert" className="mb-2 text-label text-danger">
          ⚠ {message}
        </p>
      ) : null}
      {/* SPEC-GAP: §17 asks for a DPDP notice but gives no wording; confirm this text. */}
      <p className="mb-3 text-caption text-muted-foreground">
        Your answers go only to {companyName}, to plan your wedding.
      </p>
      <Button
        type="submit"
        disabled={pending}
        aria-disabled={pending}
        className="h-12 w-full text-body-touch"
      >
        {pending
          ? 'Sending…'
          : `Send to planner${selectedCount > 0 ? ` · ${selectedCount} selected` : ''}`}
      </Button>
    </div>
  );
}

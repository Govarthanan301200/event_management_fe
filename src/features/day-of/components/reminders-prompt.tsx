import { BellRing } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useReminders } from '../hooks/use-reminders';

/**
 * Asks once per device to turn on reminders (spec §14: one push per pending task). Says plainly
 * when this phone can't get them: iPhone needs the Home Screen app (decision 2026-11-22).
 */
export function RemindersPrompt() {
  const reminders = useReminders();
  if (reminders.support === 'unsupported') return null;
  if (reminders.support === 'install-first') {
    return (
      <p className="text-caption text-muted-foreground">
        To get task reminders on iPhone, tap Share, then Add to Home Screen, and open the app from
        there.
      </p>
    );
  }
  if (reminders.blocked) {
    return (
      <p className="text-caption text-muted-foreground">
        Reminders are blocked for this site. Allow notifications in your browser settings to get
        them.
      </p>
    );
  }
  if (!reminders.known || reminders.on) return null;
  const failed = reminders.enable.error?.message;
  return (
    <div className="flex flex-col gap-3 rounded-md border border-border bg-card p-4 sunlight:border-2">
      <div className="flex items-start gap-3">
        <BellRing
          className="mt-0.5 size-6 shrink-0 text-muted-foreground"
          strokeWidth={1.5}
          aria-hidden="true"
        />
        <p className="text-body-touch">
          Get one reminder for each task still pending, at its time, on this phone.
        </p>
      </div>
      {failed ? (
        <p role="alert" className="text-label text-danger">
          ⚠{' '}
          {failed === 'blocked'
            ? 'Notifications weren’t allowed, so reminders stay off.'
            : "Couldn't turn on reminders. Try again."}
        </p>
      ) : null}
      <Button
        variant="outline"
        className="h-12 self-start px-4 text-body-touch"
        disabled={reminders.enable.isPending}
        onClick={() => {
          reminders.enable.mutate();
        }}
      >
        {reminders.enable.isPending ? 'Turning on…' : 'Turn on reminders'}
      </Button>
    </div>
  );
}

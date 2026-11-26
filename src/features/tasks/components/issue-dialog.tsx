import { onlineManager } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { phoneSheetClass } from '@/components/shared/phone-sheet';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import { errorMessage } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import type { Task } from '../api/tasks.schema';
import { useTaskStatus } from '../hooks/use-task-status';

type IssueDialogProps = { task: Task; onClose: () => void };

/**
 * Mark as issue: a note is required (decision 2026-11-26). Mount with a `key` per task. Offline
 * the change is queued (spec §14), so the dialog closes at once instead of waiting.
 */
export function IssueDialog({ task, onClose }: IssueDialogProps) {
  const setStatus = useTaskStatus();
  const [note, setNote] = useState(task.issueNote ?? '');
  const [touched, setTouched] = useState(false);
  const missing = note.trim() === '';

  const submit = () => {
    setTouched(true);
    if (missing) return;
    const target = { eventId: task.eventId, taskId: task.id };
    const change = { status: 'issue' as const, issueNote: note.trim() };
    if (!onlineManager.isOnline()) {
      setStatus.mutate(target, change);
      onClose();
      toast.success('Marked as issue · it syncs when you are back online');
      return;
    }
    setStatus.mutate(target, change, {
      onSuccess: () => {
        onClose();
        toast.success('Marked as issue');
      },
    });
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className={cn('sm:max-w-md', phoneSheetClass)}>
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="flex flex-col gap-6"
        >
          <DialogHeader>
            <DialogTitle className="text-title-serif">Mark as issue</DialogTitle>
            <DialogDescription>{task.title}</DialogDescription>
          </DialogHeader>
          <Field data-invalid={touched && missing ? true : undefined}>
            <FieldLabel htmlFor="issue-note">What went wrong?</FieldLabel>
            <Textarea
              id="issue-note"
              rows={3}
              maxLength={1000}
              value={note}
              aria-invalid={touched && missing ? true : undefined}
              aria-describedby={touched && missing ? 'issue-note-error' : undefined}
              onChange={(e) => {
                setNote(e.target.value);
              }}
            />
            {touched && missing ? (
              <FieldError id="issue-note-error">Say what went wrong</FieldError>
            ) : null}
          </Field>
          {setStatus.isError ? (
            <p role="alert" className="text-label text-danger">
              ⚠ {errorMessage(setStatus.error, "Couldn't save. Try again.")}
            </p>
          ) : null}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost" className="h-10 px-4">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={setStatus.isPending} className="h-10 px-4">
              {setStatus.isPending ? 'Saving…' : 'Mark as issue'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

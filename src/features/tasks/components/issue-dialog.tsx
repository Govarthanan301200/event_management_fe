import { useState } from 'react';
import { toast } from 'sonner';
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
import type { Task } from '../api/tasks.schema';
import { useSetTaskStatus } from '../hooks/use-tasks';

type IssueDialogProps = { eventId: string; task: Task; onClose: () => void };

/** Mark as issue: a note is required (decision 2026-11-26). Mount with a `key` per task. */
export function IssueDialog({ eventId, task, onClose }: IssueDialogProps) {
  const setStatus = useSetTaskStatus(eventId);
  const [note, setNote] = useState(task.issueNote ?? '');
  const [touched, setTouched] = useState(false);
  const missing = note.trim() === '';

  const submit = () => {
    setTouched(true);
    if (missing) return;
    setStatus.mutate(
      { taskId: task.id, change: { status: 'issue', issueNote: note.trim() } },
      {
        onSuccess: () => {
          onClose();
          toast.success('Marked as issue');
        },
      },
    );
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
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

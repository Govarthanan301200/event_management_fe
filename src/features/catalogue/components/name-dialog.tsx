import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { errorMessage } from '@/lib/api-client';

type NameDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  label: string;
  initialName?: string;
  maxLength: number;
  submitLabel: string;
  pendingLabel: string;
  /** Local check before saving; return a message to show it on the field. */
  validate?: (name: string) => string | undefined;
  /** Resolve to close; reject to show the server's message (e.g. a duplicate name) on the field. */
  onSubmit: (name: string) => Promise<unknown>;
};

/** One-field dialog for adding or renaming (categories, size labels, function types). */
export function NameDialog({ open, onOpenChange, ...formProps }: NameDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {/* Content unmounts when closed, so the form starts fresh each time it opens. */}
        <NameForm
          {...formProps}
          onDone={() => {
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

type NameFormProps = Omit<NameDialogProps, 'open' | 'onOpenChange'> & { onDone: () => void };

function NameForm({
  title,
  description,
  label,
  initialName = '',
  maxLength,
  submitLabel,
  pendingLabel,
  validate,
  onSubmit,
  onDone,
}: NameFormProps) {
  const schema = z.object({
    name: z
      .string()
      .trim()
      .min(1, 'Enter a name')
      .max(maxLength, `Keep it under ${maxLength} characters`),
  });
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { name: initialName },
  });
  const error = form.formState.errors.name;

  const submit = form.handleSubmit(async ({ name }) => {
    const problem = validate?.(name);
    if (problem) {
      form.setError('name', { message: problem });
      return;
    }
    try {
      await onSubmit(name);
      onDone();
    } catch (failure) {
      form.setError('name', { message: errorMessage(failure) });
    }
  });

  return (
    <form noValidate onSubmit={(event) => void submit(event)} className="flex flex-col gap-6">
      <DialogHeader>
        <DialogTitle className="text-title-serif">{title}</DialogTitle>
        {description ? <DialogDescription>{description}</DialogDescription> : null}
      </DialogHeader>
      <Field data-invalid={error ? true : undefined}>
        <FieldLabel htmlFor="name-dialog-input">{label}</FieldLabel>
        <Input
          id="name-dialog-input"
          autoComplete="off"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'name-dialog-error' : undefined}
          {...form.register('name')}
        />
        {error ? <FieldError id="name-dialog-error">{error.message}</FieldError> : null}
      </Field>
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? pendingLabel : submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}

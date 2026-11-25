import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
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
import { parseRupees } from '@/lib/format';
import { useSetEnvelope } from '../hooks/use-plan';

type EnvelopeDialogProps = {
  eventId: string;
  categoryId: string;
  categoryName: string;
  envelope: number | null;
  onClose: () => void;
};

const schema = z.object({
  amount: z
    .string()
    .trim()
    .refine((value) => /^\d{1,3}(,\d{2,3})*$|^\d+$/.test(value), 'Use whole rupees, like 12,00,000')
    .refine(
      (value) => Number(value.replace(/,/g, '')) <= 2_147_483_647,
      'That amount is too large',
    ),
});
type EnvelopeForm = z.infer<typeof schema>;

const grouped = new Intl.NumberFormat('en-IN');

/** Spec §11: category envelopes are set from the S7 category header. Mount only while open. */
export function EnvelopeDialog({
  eventId,
  categoryId,
  categoryName,
  envelope,
  onClose,
}: EnvelopeDialogProps) {
  const save = useSetEnvelope(eventId);
  const form = useForm<EnvelopeForm>({
    resolver: zodResolver(schema),
    defaultValues: { amount: envelope === null ? '' : grouped.format(envelope) },
  });
  const error = form.formState.errors.amount?.message;
  const commit = (amount: number | null) => {
    save.mutate(
      { categoryId, amount },
      {
        onSuccess: () => {
          onClose();
          toast.success(amount === null ? 'Envelope removed' : 'Envelope saved');
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
          onSubmit={(e) =>
            void form.handleSubmit((values) => {
              commit(parseRupees(values.amount));
            })(e)
          }
          className="flex flex-col gap-6"
        >
          <DialogHeader>
            <DialogTitle className="text-title-serif">Envelope for {categoryName}</DialogTitle>
            <DialogDescription>
              A budget cap for this category. Planned amounts above it are flagged as over.
            </DialogDescription>
          </DialogHeader>
          <Field data-invalid={error ? true : undefined}>
            <FieldLabel htmlFor="envelope-amount">Envelope (₹)</FieldLabel>
            <Input
              id="envelope-amount"
              inputMode="numeric"
              placeholder="12,00,000"
              className="tabular-nums"
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? 'envelope-amount-error' : undefined}
              {...form.register('amount')}
            />
            {error ? <FieldError id="envelope-amount-error">{error}</FieldError> : null}
          </Field>
          {save.isError ? (
            <p role="alert" className="text-label text-danger">
              ⚠ {errorMessage(save.error, "Couldn't save the envelope. Try again.")}
            </p>
          ) : null}
          <DialogFooter className="sm:justify-between">
            {envelope === null ? (
              <span />
            ) : (
              <Button
                type="button"
                variant="ghost"
                disabled={save.isPending}
                onClick={() => {
                  commit(null);
                }}
              >
                Remove envelope
              </Button>
            )}
            <Button type="submit" disabled={save.isPending} className="h-10 px-4">
              {save.isPending ? 'Saving…' : 'Save envelope'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

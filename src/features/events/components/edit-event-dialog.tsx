import { zodResolver } from '@hookform/resolvers/zod';
import type { ComponentProps } from 'react';
import { useForm } from 'react-hook-form';
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
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { errorMessage } from '@/lib/api-client';
import { parseRupees } from '@/lib/format';
import {
  eventDetailsFormSchema,
  type EventDetail,
  type EventDetailsForm,
} from '../api/events.schema';
import { useUpdateEvent } from '../hooks/use-event-mutations';

type EditEventDialogProps = {
  event: EventDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type TextName = keyof EventDetailsForm;

/** "25,00,000": the typed form of a budget, without the ₹ sign. */
const grouped = new Intl.NumberFormat('en-IN');

const LABELS: Record<TextName, string> = {
  name: 'Event name',
  clientName: 'Client name',
  clientPhone: 'Client phone',
  clientEmail: 'Client email (optional)',
  overallBudget: 'Overall budget (₹, optional)',
};

/** S6 Edit details: event name, client details and overall budget. Mount only while open. */
export function EditEventDialog({ event, open, onOpenChange }: EditEventDialogProps) {
  const update = useUpdateEvent(event.id);
  const form = useForm<EventDetailsForm>({
    resolver: zodResolver(eventDetailsFormSchema),
    defaultValues: {
      name: event.name,
      clientName: event.clientName,
      clientPhone: event.clientPhone,
      clientEmail: event.clientEmail ?? '',
      overallBudget: event.overallBudget === null ? '' : grouped.format(event.overallBudget),
    },
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) => {
    update.mutate(
      {
        name: values.name,
        clientName: values.clientName,
        clientPhone: values.clientPhone,
        clientEmail: values.clientEmail,
        overallBudget: parseRupees(values.overallBudget),
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          toast.success('Saved');
        },
      },
    );
  });

  const field = (name: TextName, input: Partial<ComponentProps<'input'>> = {}, help?: string) => {
    const id = `event-${name}`;
    const message = errors[name]?.message;
    const describedBy = [help ? `${id}-help` : null, message ? `${id}-error` : null]
      .filter(Boolean)
      .join(' ');
    return (
      <Field data-invalid={message ? true : undefined}>
        <FieldLabel htmlFor={id}>{LABELS[name]}</FieldLabel>
        <Input
          id={id}
          aria-invalid={message ? true : undefined}
          aria-describedby={describedBy || undefined}
          {...input}
          {...form.register(name)}
        />
        {help ? <FieldDescription id={`${id}-help`}>{help}</FieldDescription> : null}
        {message ? <FieldError id={`${id}-error`}>{message}</FieldError> : null}
      </Field>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <form noValidate onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-6">
          <DialogHeader>
            <DialogTitle className="text-title-serif">Edit details</DialogTitle>
            <DialogDescription>
              The client&apos;s details and the overall budget for this wedding.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            {field('name', { maxLength: 120 })}
            {field('clientName', { maxLength: 120, autoComplete: 'off' })}
            {field('clientPhone', { type: 'tel', inputMode: 'tel' })}
            {field('clientEmail', { type: 'email' })}
            {field(
              'overallBudget',
              { inputMode: 'numeric', placeholder: '25,00,000', className: 'tabular-nums' },
              'Whole rupees. Leave empty if there is no overall budget yet.',
            )}
          </FieldGroup>
          {update.isError ? (
            <p role="alert" className="text-label text-danger">
              ⚠ {errorMessage(update.error, "Couldn't save the details. Try again.")}
            </p>
          ) : null}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost" className="h-10 px-4">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={update.isPending} className="h-10 px-4">
              {update.isPending ? 'Saving…' : 'Save details'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

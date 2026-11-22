import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { createEventFormSchema, type CreateEventForm } from '../api/events.schema';
import { useCreateEvent } from '../hooks/use-event-mutations';

const emptyForm: CreateEventForm = { clientName: '', clientPhone: '', clientEmail: '', name: '' };

/** S5 minimal create: name and phone are enough, so the form link can go out at once (spec §10). */
export function CreateEventDialog() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const create = useCreateEvent();
  const form = useForm<CreateEventForm>({
    resolver: zodResolver(createEventFormSchema),
    defaultValues: emptyForm,
  });
  const { errors } = form.formState;
  const clientName = useWatch({ control: form.control, name: 'clientName' }).trim();

  const onSubmit = form.handleSubmit((values) => {
    create.mutate(values, {
      onSuccess: (event) => {
        setOpen(false);
        form.reset(emptyForm);
        void navigate(`/events/${event.id}`);
      },
    });
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-10 px-4">Create event</Button>
      </DialogTrigger>
      <DialogContent>
        <form noValidate onSubmit={(event) => void onSubmit(event)} className="flex flex-col gap-6">
          <DialogHeader>
            <DialogTitle className="text-title-serif">Create event</DialogTitle>
            <DialogDescription>
              You can add functions and budgets later. The client&apos;s form link is ready as soon
              as you save.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field data-invalid={errors.clientName ? true : undefined}>
              <FieldLabel htmlFor="clientName">Client name</FieldLabel>
              <Input
                id="clientName"
                autoComplete="off"
                aria-invalid={errors.clientName ? true : undefined}
                aria-describedby={errors.clientName ? 'clientName-error' : undefined}
                {...form.register('clientName')}
              />
              {errors.clientName ? (
                <FieldError id="clientName-error">{errors.clientName.message}</FieldError>
              ) : null}
            </Field>
            <Field data-invalid={errors.clientPhone ? true : undefined}>
              <FieldLabel htmlFor="clientPhone">Client phone</FieldLabel>
              <Input
                id="clientPhone"
                type="tel"
                inputMode="tel"
                placeholder="+91 98765 43210"
                aria-invalid={errors.clientPhone ? true : undefined}
                aria-describedby={errors.clientPhone ? 'clientPhone-error' : undefined}
                {...form.register('clientPhone')}
              />
              {errors.clientPhone ? (
                <FieldError id="clientPhone-error">{errors.clientPhone.message}</FieldError>
              ) : null}
            </Field>
            <Field data-invalid={errors.clientEmail ? true : undefined}>
              <FieldLabel htmlFor="clientEmail">Client email (optional)</FieldLabel>
              <Input
                id="clientEmail"
                type="email"
                aria-invalid={errors.clientEmail ? true : undefined}
                aria-describedby={errors.clientEmail ? 'clientEmail-error' : undefined}
                {...form.register('clientEmail')}
              />
              {errors.clientEmail ? (
                <FieldError id="clientEmail-error">{errors.clientEmail.message}</FieldError>
              ) : null}
            </Field>
            <Field>
              <FieldLabel htmlFor="eventName">Event name (optional)</FieldLabel>
              <Input
                id="eventName"
                placeholder={clientName ? `${clientName} wedding` : 'Client name wedding'}
                aria-describedby="eventName-help"
                {...form.register('name')}
              />
              <FieldDescription id="eventName-help">
                Leave empty to use the client&apos;s name.
              </FieldDescription>
            </Field>
          </FieldGroup>
          {create.isError ? (
            <p role="alert" className="text-label text-danger">
              ⚠ {create.error.message || "Couldn't create the event. Try again."}
            </p>
          ) : null}
          <DialogFooter>
            <Button type="submit" disabled={create.isPending} className="h-10 px-4">
              {create.isPending ? 'Creating…' : 'Create event'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

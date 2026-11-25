import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
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
import { Textarea } from '@/components/ui/textarea';
import { errorMessage } from '@/lib/api-client';
import { endsNextDay } from '@/lib/format';
import {
  functionFormSchema,
  OTHER_FUNCTION,
  type EventFunction,
  type FunctionForm,
} from '../api/events.schema';
import { useCreateFunction, useUpdateFunction } from '../hooks/use-function-mutations';
import { savedMessage, toFunctionForm, toFunctionInput } from '../lib/function-form';
import { FunctionTypeField } from './function-type-field';

type FunctionDialogProps = {
  eventId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Absent = Add function. */
  editing?: EventFunction | undefined;
};

/** S6 Add / edit function: every field in spec §10. Mount with a `key` per function. */
export function FunctionDialog({ eventId, open, onOpenChange, editing }: FunctionDialogProps) {
  const create = useCreateFunction(eventId);
  const update = useUpdateFunction(eventId);
  const form = useForm<FunctionForm>({
    resolver: zodResolver(functionFormSchema),
    defaultValues: toFunctionForm(editing),
  });
  const { errors } = form.formState;
  const [typeId, start, end] = useWatch({
    control: form.control,
    name: ['functionTypeId', 'startTime', 'endTime'],
  });
  const saving = create.isPending || update.isPending;
  const failure = create.error ?? update.error;

  const onSubmit = form.handleSubmit((values) => {
    const input = toFunctionInput(values);
    const done = (message: string) => {
      onOpenChange(false);
      toast.success(message);
    };
    if (editing) {
      update.mutate(
        { functionId: editing.id, input },
        {
          onSuccess: (result) => {
            done(savedMessage(result.effects, result.function.date));
          },
        },
      );
    } else {
      create.mutate(input, {
        onSuccess: (created) => {
          done(`${created.name} added`);
        },
      });
    }
  });

  const text = (
    name: 'customName' | 'venueName' | 'date' | 'startTime' | 'endTime' | 'guestCount',
  ) => ({
    id: `function-${name}`,
    'aria-invalid': errors[name] ? true : undefined,
    'aria-describedby': errors[name] ? `function-${name}-error` : undefined,
    ...form.register(name),
  });
  const error = (name: keyof FunctionForm) =>
    errors[name] ? (
      <FieldError id={`function-${name}-error`}>{errors[name].message}</FieldError>
    ) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <form noValidate onSubmit={(event) => void onSubmit(event)} className="flex flex-col gap-6">
          <DialogHeader>
            <DialogTitle className="text-title-serif">
              {editing ? `Edit ${editing.name}` : 'Add function'}
            </DialogTitle>
            <DialogDescription>
              Each function has its own date, time, venue and guest count. Several can share a date.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <FunctionTypeField
              control={form.control}
              editing={editing}
              error={errors.functionTypeId?.message}
            />
            {typeId === OTHER_FUNCTION ? (
              <Field data-invalid={errors.customName ? true : undefined}>
                <FieldLabel htmlFor="function-customName">Function name</FieldLabel>
                <Input placeholder="Nalangu" maxLength={80} {...text('customName')} />
                {error('customName')}
              </Field>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-3">
              <Field data-invalid={errors.date ? true : undefined}>
                <FieldLabel htmlFor="function-date">Date</FieldLabel>
                <Input type="date" {...text('date')} />
                {error('date')}
              </Field>
              <Field data-invalid={errors.startTime ? true : undefined}>
                <FieldLabel htmlFor="function-startTime">Start</FieldLabel>
                <Input type="time" {...text('startTime')} />
                {error('startTime')}
              </Field>
              <Field data-invalid={errors.endTime ? true : undefined}>
                <FieldLabel htmlFor="function-endTime">End (optional)</FieldLabel>
                <Input type="time" {...text('endTime')} />
                {error('endTime')}
              </Field>
            </div>
            {/* SPEC-GAP default: an end before the start means the function runs past midnight. */}
            {endsNextDay(start, end === '' ? null : end) && start !== '' ? (
              <p className="-mt-3 text-caption text-muted-foreground">
                Ends after midnight, the next day.
              </p>
            ) : null}
            <Field>
              <FieldLabel htmlFor="function-venueName">Venue name (optional)</FieldLabel>
              <Input maxLength={200} {...text('venueName')} />
            </Field>
            <Field>
              <FieldLabel htmlFor="function-venueAddress">Venue address (optional)</FieldLabel>
              <Textarea
                id="function-venueAddress"
                rows={2}
                maxLength={500}
                {...form.register('venueAddress')}
              />
            </Field>
            <Field data-invalid={errors.guestCount ? true : undefined}>
              <FieldLabel htmlFor="function-guestCount">Guests</FieldLabel>
              <Input inputMode="numeric" className="w-32 tabular-nums" {...text('guestCount')} />
              <FieldDescription>Used to pre-fill pax on services.</FieldDescription>
              {error('guestCount')}
            </Field>
          </FieldGroup>
          {failure ? (
            <p role="alert" className="text-label text-danger">
              ⚠ {errorMessage(failure, "Couldn't save the function. Try again.")}
            </p>
          ) : null}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost" className="h-10 px-4">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={saving} className="h-10 px-4">
              {saving ? 'Saving…' : editing ? 'Save function' : 'Add function'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

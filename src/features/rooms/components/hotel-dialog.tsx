import { zodResolver } from '@hookform/resolvers/zod';
import { useState, type ComponentProps } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import { ApiError, errorMessage } from '@/lib/api-client';
import type { Hotel } from '../api/rooms.schema';
import { useHotels } from '../hooks/use-hotels';

const schema = z.object({
  name: z.string().trim().min(1, 'Enter the hotel name').max(120, 'Keep it under 120 characters'),
  area: z.string().trim().max(120, 'Keep it under 120 characters'),
  contact: z.string().trim().max(60, 'Keep it under 60 characters'),
});
type HotelForm = z.infer<typeof schema>;

const orNull = (text: string) => (text.trim() === '' ? null : text.trim());

type HotelDialogProps = {
  eventId: string;
  /** null adds a hotel. */
  hotel: Hotel | null;
  /** Rows using this hotel, for the delete warning. */
  usedBy: number;
  onClose: () => void;
};

/**
 * A hotel of this event (spec §10 "name, area, front-desk contact"). Mount only while open.
 * Delete asks first: rows that used it keep everything but the hotel.
 */
export function HotelDialog({ eventId, hotel, usedBy, onClose }: HotelDialogProps) {
  const { create, update, remove } = useHotels(eventId);
  const [confirming, setConfirming] = useState(false);
  const form = useForm<HotelForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: hotel?.name ?? '',
      area: hotel?.area ?? '',
      contact: hotel?.contact ?? '',
    },
  });
  const { errors } = form.formState;
  const save = hotel ? update : create;

  const submit = (values: HotelForm) => {
    const input = {
      name: values.name.trim(),
      area: orNull(values.area),
      contact: orNull(values.contact),
    };
    const done = {
      onSuccess: () => {
        onClose();
        toast.success(hotel ? 'Hotel saved' : `Added ${input.name}`);
      },
      onError: (error: Error) => {
        if (error instanceof ApiError && error.status === 409) {
          form.setError('name', { message: error.message });
        }
      },
    };
    if (hotel) update.mutate({ id: hotel.id, input }, done);
    else create.mutate(input, done);
  };

  if (confirming && hotel) {
    return (
      <AlertDialog
        open
        onOpenChange={(open) => {
          if (!open) setConfirming(false);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {hotel.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              {usedBy === 0
                ? 'No guest rows use it.'
                : `${usedBy === 1 ? '1 guest row uses' : `${String(usedBy)} guest rows use`} it. They stay, with no hotel.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {remove.isError ? (
            <p role="alert" className="text-label text-danger">
              ⚠ {errorMessage(remove.error, "Couldn't delete the hotel. Try again.")}
            </p>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={remove.isPending}
              onClick={() => {
                remove.mutate(hotel.id, {
                  onSuccess: () => {
                    onClose();
                    toast.success(`Deleted ${hotel.name}`);
                  },
                });
              }}
            >
              {remove.isPending ? 'Deleting…' : 'Delete hotel'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

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
          onSubmit={(e) => void form.handleSubmit(submit)(e)}
          className="flex flex-col gap-6"
        >
          <DialogHeader>
            <DialogTitle className="text-title-serif">
              {hotel ? hotel.name : 'Add a hotel'}
            </DialogTitle>
            <DialogDescription>
              Hotels are typed for this event only. Each guest row picks its hotel from this list.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <TextField
              id="hotel-name"
              label="Name"
              error={errors.name?.message}
              {...form.register('name')}
            />
            <TextField
              id="hotel-area"
              label="Area"
              placeholder="ECR"
              error={errors.area?.message}
              {...form.register('area')}
            />
            <TextField
              id="hotel-contact"
              label="Front-desk contact"
              inputMode="tel"
              error={errors.contact?.message}
              {...form.register('contact')}
            />
          </div>
          {save.isError && !(save.error instanceof ApiError && save.error.status === 409) ? (
            <p role="alert" className="text-label text-danger">
              ⚠ {errorMessage(save.error, "Couldn't save the hotel. Try again.")}
            </p>
          ) : null}
          <DialogFooter className="sm:justify-between">
            {hotel ? (
              <Button
                type="button"
                variant="ghost"
                className="text-danger hover:bg-danger-soft hover:text-danger"
                onClick={() => {
                  setConfirming(true);
                }}
              >
                Delete hotel
              </Button>
            ) : (
              <span />
            )}
            <Button type="submit" disabled={save.isPending} className="h-10 px-4">
              {save.isPending ? 'Saving…' : hotel ? 'Save hotel' : 'Add hotel'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type TextFieldProps = ComponentProps<typeof Input> & {
  id: string;
  label: string;
  error: string | undefined;
};

function TextField({ id, label, error, ...input }: TextFieldProps) {
  return (
    <Field data-invalid={error ? true : undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        {...input}
      />
      {error ? <FieldError id={`${id}-error`}>{error}</FieldError> : null}
    </Field>
  );
}

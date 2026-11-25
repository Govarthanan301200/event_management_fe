import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { createVendor, vendorsKeys } from '@/features/vendors';
import { errorMessage } from '@/lib/api-client';
import { planKeys } from '../../api/plan.api';

type NewVendorDialogProps = {
  serviceId: string;
  serviceName: string;
  onCreated: (vendorId: string) => void;
  onClose: () => void;
};

const schema = z.object({
  name: z.string().trim().min(1, 'Enter the vendor name').max(120),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9 ()-]+$/, 'Use digits, spaces and an optional leading +')
    .refine((value) => {
      const digits = value.replace(/\D/g, '').length;
      return digits >= 8 && digits <= 15;
    }, 'Enter a phone number with 8 to 15 digits'),
});
type NewVendorForm = z.infer<typeof schema>;

/**
 * S8 "+ New vendor" (spec §11 step 2): name and phone only, already offering this service.
 * The rest of the profile can be filled in later on S4.
 */
export function NewVendorDialog({
  serviceId,
  serviceName,
  onCreated,
  onClose,
}: NewVendorDialogProps) {
  const queryClient = useQueryClient();
  const create = useMutation({
    mutationFn: (values: NewVendorForm) =>
      createVendor({
        name: values.name,
        phone: values.phone,
        contactPerson: '',
        altPhone: '',
        city: '',
        address: '',
        portfolioUrl: '',
        notes: '',
        contacts: [],
        services: [{ serviceId, rateAmount: null, rateBasis: null, rateNote: '' }],
      }),
    onSuccess: async (vendor) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: planKeys.vendorOptions(serviceId) }),
        queryClient.invalidateQueries({ queryKey: vendorsKeys.all }),
      ]);
      onCreated(vendor.id);
    },
  });
  const form = useForm<NewVendorForm>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', phone: '' },
  });
  const { errors } = form.formState;

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
            e.stopPropagation(); // why: keep the submit from reaching the drawer's form behind it
            void form.handleSubmit((values) => {
              create.mutate(values);
            })(e);
          }}
          className="flex flex-col gap-6"
        >
          <DialogHeader>
            <DialogTitle className="text-title-serif">New vendor</DialogTitle>
            <DialogDescription>
              Saved as offering {serviceName}. Add the rest of their profile later.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field data-invalid={errors.name ? true : undefined}>
              <FieldLabel htmlFor="new-vendor-name">Vendor name</FieldLabel>
              <Input
                id="new-vendor-name"
                aria-invalid={errors.name ? true : undefined}
                aria-describedby={errors.name ? 'new-vendor-name-error' : undefined}
                {...form.register('name')}
              />
              {errors.name ? (
                <FieldError id="new-vendor-name-error">{errors.name.message}</FieldError>
              ) : null}
            </Field>
            <Field data-invalid={errors.phone ? true : undefined}>
              <FieldLabel htmlFor="new-vendor-phone">Phone</FieldLabel>
              <Input
                id="new-vendor-phone"
                type="tel"
                inputMode="tel"
                aria-invalid={errors.phone ? true : undefined}
                aria-describedby={errors.phone ? 'new-vendor-phone-error' : undefined}
                {...form.register('phone')}
              />
              {errors.phone ? (
                <FieldError id="new-vendor-phone-error">{errors.phone.message}</FieldError>
              ) : null}
            </Field>
          </FieldGroup>
          {create.isError ? (
            <p role="alert" className="text-label text-danger">
              ⚠ {errorMessage(create.error, "Couldn't save the vendor. Try again.")}
            </p>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={create.isPending} className="h-10 px-4">
              {create.isPending ? 'Saving…' : 'Save vendor'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

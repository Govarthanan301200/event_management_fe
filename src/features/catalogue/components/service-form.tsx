import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { errorMessage } from '@/lib/api-client';
import {
  serviceFormSchema,
  type CatalogueCategory,
  type ServiceForm as ServiceFormValues,
} from '../api/catalogue.schema';
import { useCreateService, useUpdateService } from '../hooks/use-catalogue';
import {
  serviceChangeFrom,
  serviceFormDefaults,
  type ServiceDialogMode,
} from '../lib/service-form';
import { CategorySelect } from './category-select';
import { ParameterChoice } from './parameter-choice';

type ServiceFormProps = {
  mode: ServiceDialogMode;
  categories: CatalogueCategory[];
  onDone: () => void;
};

export function ServiceForm({ mode, categories, onDone }: ServiceFormProps) {
  const create = useCreateService();
  const update = useUpdateService();
  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: serviceFormDefaults(mode),
  });
  const { errors, isSubmitting } = form.formState;
  const categoryId = useWatch({ control: form.control, name: 'categoryId' });
  const target = categories.find((category) => category.id === categoryId) ?? mode.category;
  const editing = mode.kind === 'edit';

  const submit = form.handleSubmit(async (values) => {
    try {
      if (mode.kind === 'add') {
        await create.mutateAsync({
          categoryId: mode.category.id,
          input: serviceChangeFrom(values),
        });
      } else {
        await update.mutateAsync({
          id: mode.service.id,
          change: serviceChangeFrom(values, mode.service),
        });
      }
      onDone();
    } catch (failure) {
      form.setError('root', {
        message: errorMessage(failure, "Couldn't save the service. Try again."),
      });
    }
  });

  return (
    <form noValidate onSubmit={(event) => void submit(event)} className="flex flex-col gap-6">
      <DialogHeader>
        <DialogTitle className="text-title-serif">
          {editing ? 'Edit service' : 'Add service'}
        </DialogTitle>
        <DialogDescription>
          {editing ? `In ${mode.category.name}.` : `New service in ${mode.category.name}.`}
        </DialogDescription>
      </DialogHeader>
      <FieldGroup>
        <Field data-invalid={errors.name ? true : undefined}>
          <FieldLabel htmlFor="service-name">Service name</FieldLabel>
          <Input
            id="service-name"
            autoComplete="off"
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? 'service-name-error' : undefined}
            {...form.register('name')}
          />
          {errors.name ? (
            <FieldError id="service-name-error">{errors.name.message}</FieldError>
          ) : null}
        </Field>
        <Field data-invalid={errors.description ? true : undefined}>
          <FieldLabel htmlFor="service-description">Description (optional)</FieldLabel>
          <Textarea
            id="service-description"
            rows={2}
            aria-invalid={errors.description ? true : undefined}
            aria-describedby={
              errors.description ? 'service-description-error' : 'service-description-help'
            }
            {...form.register('description')}
          />
          {errors.description ? (
            <FieldError id="service-description-error">{errors.description.message}</FieldError>
          ) : (
            <p id="service-description-help" className="text-caption text-muted-foreground">
              Clients see this under the service name on their form.
            </p>
          )}
        </Field>
        {editing ? (
          <Controller
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <CategorySelect
                id="service-category"
                label="Category"
                categories={categories}
                {...field}
              />
            )}
          />
        ) : null}
        <Controller
          control={form.control}
          name="showOnClientForm"
          render={({ field }) => (
            <div className="flex items-center gap-3">
              <Switch id="service-client" checked={field.value} onCheckedChange={field.onChange} />
              <Label htmlFor="service-client" className="text-body font-normal">
                Show on client form · {field.value ? 'Shown' : 'Hidden'}
              </Label>
            </div>
          )}
        />
        <Controller
          control={form.control}
          name="hasRooms"
          render={({ field }) => (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <Switch
                  id="service-rooms"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  aria-describedby="service-rooms-help"
                />
                <Label htmlFor="service-rooms" className="text-body font-normal">
                  Has rooms and guests · {field.value ? 'On' : 'Off'}
                </Label>
              </div>
              <p id="service-rooms-help" className="text-caption text-muted-foreground">
                This service&apos;s line in Plan opens the event&apos;s rooms and guests table.
              </p>
            </div>
          )}
        />
        <ParameterChoice
          control={form.control}
          category={target}
          error={errors.override?.message}
        />
      </FieldGroup>
      {errors.root ? (
        <p role="alert" className="text-label text-danger">
          ⚠ {errors.root.message}
        </p>
      ) : null}
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : 'Save service'}
        </Button>
      </DialogFooter>
    </form>
  );
}

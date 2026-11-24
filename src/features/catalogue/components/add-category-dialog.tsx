import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
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
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { errorMessage } from '@/lib/api-client';
import { categoryFormSchema, type CategoryForm } from '../api/catalogue.schema';
import { useCreateCategory } from '../hooks/use-catalogue';
import { ParameterToggle } from './parameter-toggle';

type AddCategoryDialogProps = { onCreated: (categoryId: string) => void };

/** S2 "+ Add category": a name and at least one parameter (spec §4); the rest is set on the panel. */
export function AddCategoryDialog({ onCreated }: AddCategoryDialogProps) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="justify-start">
          <Plus strokeWidth={1.5} aria-hidden="true" />
          Add category
        </Button>
      </DialogTrigger>
      <DialogContent>
        <AddCategoryForm
          onDone={(categoryId) => {
            setOpen(false);
            if (categoryId) onCreated(categoryId);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

type AddCategoryFormProps = { onDone: (categoryId?: string) => void };

function AddCategoryForm({ onDone }: AddCategoryFormProps) {
  const create = useCreateCategory();
  const form = useForm<CategoryForm>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: { name: '', parameters: [] },
  });
  const { errors, isSubmitting } = form.formState;

  const submit = form.handleSubmit(async (values) => {
    try {
      const category = await create.mutateAsync({
        name: values.name.trim(),
        parameters: values.parameters,
      });
      onDone(category.id);
    } catch (failure) {
      form.setError('name', {
        message: errorMessage(failure, "Couldn't add the category. Try again."),
      });
    }
  });

  return (
    <form noValidate onSubmit={(event) => void submit(event)} className="flex flex-col gap-6">
      <DialogHeader>
        <DialogTitle className="text-title-serif">Add category</DialogTitle>
        <DialogDescription>
          Its services inherit these parameters unless you choose otherwise.
        </DialogDescription>
      </DialogHeader>
      <FieldGroup>
        <Field data-invalid={errors.name ? true : undefined}>
          <FieldLabel htmlFor="category-name">Category name</FieldLabel>
          <Input
            id="category-name"
            autoComplete="off"
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? 'category-name-error' : undefined}
            {...form.register('name')}
          />
          {errors.name ? (
            <FieldError id="category-name-error">{errors.name.message}</FieldError>
          ) : null}
        </Field>
        <FieldSet>
          <FieldLegend variant="label">Parameters</FieldLegend>
          <Controller
            control={form.control}
            name="parameters"
            render={({ field }) => (
              <ParameterToggle
                label="Parameters for the new category"
                value={field.value}
                allowEmpty
                aria-describedby={errors.parameters ? 'category-parameters-error' : undefined}
                onChange={field.onChange}
              />
            )}
          />
          {errors.parameters ? (
            <FieldError id="category-parameters-error">{errors.parameters.message}</FieldError>
          ) : null}
        </FieldSet>
      </FieldGroup>
      <DialogFooter>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            onDone();
          }}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Adding…' : 'Add category'}
        </Button>
      </DialogFooter>
    </form>
  );
}

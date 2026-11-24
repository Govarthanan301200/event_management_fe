import { Controller, useWatch, type Control } from 'react-hook-form';
import { FieldError, FieldLegend, FieldSet } from '@/components/ui/field';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { Category, ServiceForm } from '../api/catalogue.schema';
import { parameterList } from '../lib/parameters';
import { ParameterToggle } from './parameter-toggle';

type ParameterChoiceProps = {
  control: Control<ServiceForm>;
  /** The category the service is (or will be) in: its parameters are what "Inherit" means. */
  category: Category;
  error: string | undefined;
};

/** Spec §8 service "parameter override (default: inherit)". The override wins over the category. */
export function ParameterChoice({ control, category, error }: ParameterChoiceProps) {
  const mode = useWatch({ control, name: 'parameterMode' });

  return (
    <FieldSet>
      <FieldLegend variant="label">Parameters</FieldLegend>
      <Controller
        control={control}
        name="parameterMode"
        render={({ field }) => (
          <RadioGroup value={field.value} onValueChange={field.onChange} className="gap-2">
            <div className="flex items-center gap-2">
              <RadioGroupItem id="parameters-inherit" value="inherit" />
              <Label htmlFor="parameters-inherit" className="text-body font-normal">
                Inherit from {category.name} ({parameterList(category.parameters)})
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem id="parameters-override" value="override" />
              <Label htmlFor="parameters-override" className="text-body font-normal">
                Choose for this service
              </Label>
            </div>
          </RadioGroup>
        )}
      />
      {mode === 'override' ? (
        <Controller
          control={control}
          name="override"
          render={({ field }) => (
            <ParameterToggle
              label="Parameters for this service"
              value={field.value}
              allowEmpty
              aria-describedby={error ? 'override-error' : undefined}
              onChange={field.onChange}
            />
          )}
        />
      ) : null}
      {error ? <FieldError id="override-error">{error}</FieldError> : null}
    </FieldSet>
  );
}

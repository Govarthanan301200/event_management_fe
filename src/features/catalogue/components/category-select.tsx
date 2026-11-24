import { Field, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Category } from '../api/catalogue.schema';

type CategorySelectProps = {
  id: string;
  label: string;
  categories: Pick<Category, 'id' | 'name'>[];
  value: string;
  onChange: (categoryId: string) => void;
  className?: string;
};

/** Category picker: moving a service (spec §8) and the S2 category switcher below 1024px. */
export function CategorySelect({
  id,
  label,
  categories,
  value,
  onChange,
  className,
}: CategorySelectProps) {
  return (
    <Field className={className}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className="h-10 w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper">
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

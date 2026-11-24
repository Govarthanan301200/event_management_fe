import { z } from 'zod';

// Mirrors Backend/src/modules/catalogue/catalogue.schema.ts and function-types.schema.ts.

/** Spec §4 parameter keys, in the order the UI lists them. */
export const PARAMETER_KEYS = ['pax', 'hours', 'minutes', 'size', 'work'] as const;
export const parameterKeySchema = z.enum(PARAMETER_KEYS);
export type ParameterKey = z.infer<typeof parameterKeySchema>;

export const PARAMETER_LABEL: Record<ParameterKey, string> = {
  pax: 'Pax',
  hours: 'Hours',
  minutes: 'Minutes',
  size: 'Size',
  work: 'Work',
};

export const MAX_SIZE_LABELS = 10;

export const serviceSchema = z.object({
  id: z.string(),
  categoryId: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  showOnClientForm: z.boolean(),
  /** null = inherit the category's parameters. */
  parametersOverride: z.array(parameterKeySchema).nullable(),
  effectiveParameters: z.array(parameterKeySchema),
  sortOrder: z.number().int(),
  archivedAt: z.coerce.date().nullable(),
});
export type Service = z.infer<typeof serviceSchema>;

export const categorySchema = z.object({
  id: z.string(),
  name: z.string(),
  sortOrder: z.number().int(),
  parameters: z.array(parameterKeySchema),
  paxPrefill: z.boolean(),
  sizeLabels: z.array(z.string()),
  archivedAt: z.coerce.date().nullable(),
});
export type Category = z.infer<typeof categorySchema>;

export const catalogueSchema = z.object({
  categories: z.array(categorySchema.extend({ services: z.array(serviceSchema) })),
  canReset: z.boolean(),
});
export type Catalogue = z.infer<typeof catalogueSchema>;
export type CatalogueCategory = Catalogue['categories'][number];

export const functionTypeSchema = z.object({
  id: z.string(),
  name: z.string(),
  sortOrder: z.number().int(),
  archivedAt: z.coerce.date().nullable(),
});
export type FunctionType = z.infer<typeof functionTypeSchema>;

// Form schemas (same limits as the backend).

const name = (max: number) => z.string().trim().min(1, 'Enter a name').max(max);
const parameterList = z.array(parameterKeySchema).min(1, 'Choose at least one parameter');

export const nameFormSchema = z.object({ name: name(120) });
export type NameForm = z.infer<typeof nameFormSchema>;

export const functionTypeFormSchema = z.object({ name: name(80) });

export const categoryFormSchema = z.object({ name: name(120), parameters: parameterList });
export type CategoryForm = z.infer<typeof categoryFormSchema>;

export const serviceFormSchema = z
  .object({
    name: name(120),
    description: z.string().trim().max(500, 'Keep the description under 500 characters'),
    categoryId: z.string().min(1),
    showOnClientForm: z.boolean(),
    parameterMode: z.enum(['inherit', 'override']),
    override: z.array(parameterKeySchema),
  })
  .refine((form) => form.parameterMode === 'inherit' || form.override.length > 0, {
    message: 'Choose at least one parameter, or inherit the category’s',
    path: ['override'],
  });
export type ServiceForm = z.infer<typeof serviceFormSchema>;

export const sizeLabelSchema = z
  .string()
  .trim()
  .min(1, 'Enter a label')
  .max(40, 'Keep labels under 40 characters');

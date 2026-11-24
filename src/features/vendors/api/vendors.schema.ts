import { z } from 'zod';

// Mirrors Backend/src/modules/vendors/vendors.schema.ts.

/** Spec §9 rate basis (decision 2026-11-24: `size` means per sq ft of total area). */
export const RATE_BASES = ['pax', 'hours', 'minutes', 'size', 'package'] as const;
export const rateBasisSchema = z.enum(RATE_BASES);
export type RateBasis = z.infer<typeof rateBasisSchema>;

export const RATE_BASIS_LABEL: Record<RateBasis, string> = {
  pax: 'per pax',
  hours: 'per hour',
  minutes: 'per minute',
  size: 'per sq ft',
  package: 'package',
};

export const vendorSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  contactPerson: z.string().nullable(),
  phone: z.string(),
  city: z.string().nullable(),
  archivedAt: z.coerce.date().nullable(),
  services: z.array(z.object({ id: z.string(), name: z.string(), categoryId: z.string() })),
});
export type VendorSummary = z.infer<typeof vendorSummarySchema>;

export const vendorPageSchema = z.object({
  data: z.array(vendorSummarySchema),
  nextCursor: z.string().nullable(),
});

export const vendorFacetsSchema = z.object({
  total: z.number().int(),
  archived: z.number().int(),
  categories: z.array(z.object({ categoryId: z.string(), count: z.number().int() })),
  services: z.array(z.object({ serviceId: z.string(), count: z.number().int() })),
});
export type VendorFacets = z.infer<typeof vendorFacetsSchema>;

export const phoneMatchSchema = z.object({
  id: z.string(),
  name: z.string(),
  archived: z.boolean(),
});
export type PhoneMatch = z.infer<typeof phoneMatchSchema>;

export const offeredServiceSchema = z.object({
  serviceId: z.string(),
  serviceName: z.string(),
  categoryId: z.string(),
  categoryName: z.string(),
  archived: z.boolean(),
  rateAmount: z.number().int().nullable(),
  rateBasis: rateBasisSchema.nullable(),
  rateNote: z.string().nullable(),
});
export type OfferedService = z.infer<typeof offeredServiceSchema>;

export const vendorDetailSchema = z.object({
  id: z.string(),
  name: z.string(),
  contactPerson: z.string().nullable(),
  phone: z.string(),
  altPhone: z.string().nullable(),
  city: z.string().nullable(),
  address: z.string().nullable(),
  portfolioUrl: z.string().nullable(),
  notes: z.string().nullable(),
  archivedAt: z.coerce.date().nullable(),
  contacts: z.array(
    z.object({ id: z.string(), name: z.string(), role: z.string().nullable(), phone: z.string() }),
  ),
  services: z.array(offeredServiceSchema),
  categories: z.array(z.object({ id: z.string(), name: z.string() })),
  canDelete: z.boolean(),
});
export type VendorDetail = z.infer<typeof vendorDetailSchema>;

// Form schema (same limits as the backend).

const phonePattern = /^\+?[0-9 ()-]+$/;
const hasPhoneDigits = (value: string) => {
  const digits = value.replace(/\D/g, '').length;
  return digits >= 8 && digits <= 15;
};
const phone = z
  .string()
  .trim()
  .min(1, 'Enter a phone number')
  .regex(phonePattern, 'Use digits, spaces and an optional leading +')
  .refine(hasPhoneDigits, 'Enter a phone number with 8 to 15 digits');
const optionalPhone = z
  .string()
  .trim()
  .refine(
    (value) => value === '' || phonePattern.test(value),
    'Use digits, spaces and an optional leading +',
  )
  .refine(
    (value) => value === '' || hasPhoneDigits(value),
    'Enter a phone number with 8 to 15 digits',
  );
const optionalText = (max: number, label: string) =>
  z.string().trim().max(max, `Keep the ${label} under ${max} characters`);

/** Whole rupees as typed: digits with optional Indian grouping commas ("8,000"). */
export const rateAmountPattern = /^[0-9][0-9,]*$/;

const serviceRow = z
  .object({
    serviceId: z.string(),
    rateAmount: z
      .string()
      .trim()
      .refine(
        (value) => value === '' || rateAmountPattern.test(value),
        'Use whole rupees, like 8,000',
      )
      .refine(
        (value) => value === '' || Number(value.replace(/,/g, '')) <= 1_000_000_000,
        'That amount is too large',
      ),
    rateBasis: z.union([z.literal(''), rateBasisSchema]),
    rateNote: optionalText(120, 'note'),
  })
  .superRefine((row, ctx) => {
    if (row.rateAmount !== '' && row.rateBasis === '') {
      ctx.addIssue({ code: 'custom', path: ['rateBasis'], message: 'Choose what the rate is per' });
    }
    if (row.rateAmount === '' && row.rateBasis !== '') {
      ctx.addIssue({
        code: 'custom',
        path: ['rateAmount'],
        message: 'Enter the rate, or set Per to Not set',
      });
    }
  });
export type VendorServiceRow = z.infer<typeof serviceRow>;

export const vendorFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Enter the vendor name')
    .max(120, 'Keep the name under 120 characters'),
  contactPerson: optionalText(120, 'name'),
  phone,
  altPhone: optionalPhone,
  city: optionalText(80, 'city'),
  address: optionalText(500, 'address'),
  portfolioUrl: z
    .string()
    .trim()
    .refine(
      (value) => value === '' || /^https?:\/\/\S+\.\S+/i.test(value),
      'Enter a link starting with https://',
    ),
  notes: optionalText(2000, 'notes'),
  contacts: z
    .array(
      z.object({
        name: z.string().trim().min(1, 'Enter a name').max(120),
        role: optionalText(80, 'role'),
        phone,
      }),
    )
    .max(20, 'Add up to 20 team contacts'),
  services: z.array(serviceRow).min(1, 'Choose at least one service this vendor offers'),
});
export type VendorForm = z.infer<typeof vendorFormSchema>;

import { z } from 'zod';
import { rateBasisSchema } from '@/features/vendors';

// Mirrors Backend/src/modules/service-lines/service-lines.schema.ts.

export const sizeMeasurementSchema = z.object({
  label: z.string(),
  lengthFt: z.number(),
  widthFt: z.number(),
});

export const quantitiesSchema = z.object({
  pax: z.number().optional(),
  hours: z.number().optional(),
  minutes: z.number().optional(),
  size: z.array(sizeMeasurementSchema).optional(),
  work: z.string().optional(),
});
export type Quantities = z.infer<typeof quantitiesSchema>;

const vendorRefSchema = z.object({
  name: z.string(),
  archived: z.boolean(),
  /** False once the vendor stops offering the line's service (decision 2026-11-25). */
  offersService: z.boolean(),
});
export type VendorRef = z.infer<typeof vendorRefSchema>;

export const functionRowSchema = z.object({
  id: z.string(),
  eventFunctionId: z.string(),
  vendorId: z.string().nullable(),
  vendor: vendorRefSchema.nullable(),
  quantities: quantitiesSchema,
  paxEdited: z.boolean(),
  budget: z.number().int().nullable(),
});
export type FunctionRow = z.infer<typeof functionRowSchema>;

export const serviceLineSchema = z.object({
  id: z.string(),
  serviceId: z.string(),
  serviceName: z.string(),
  categoryId: z.string(),
  serviceArchived: z.boolean(),
  defaultVendorId: z.string().nullable(),
  defaultVendor: vendorRefSchema.nullable(),
  perFunctionVendor: z.boolean(),
  lineBudget: z.number().int().nullable(),
  notes: z.string().nullable(),
  rows: z.array(functionRowSchema),
});
export type ServiceLine = z.infer<typeof serviceLineSchema>;

export const servicePlanSchema = z.object({
  lines: z.array(serviceLineSchema),
  envelopes: z.array(z.object({ categoryId: z.string(), amount: z.number().int() })),
});
export type ServicePlan = z.infer<typeof servicePlanSchema>;

export const vendorOptionSchema = z.object({
  id: z.string(),
  name: z.string(),
  city: z.string().nullable(),
  rateAmount: z.number().int().nullable(),
  rateBasis: rateBasisSchema.nullable(),
  rateNote: z.string().nullable(),
});
export type VendorOption = z.infer<typeof vendorOptionSchema>;

/** The S8 request body (spec §11). */
export type LineInput = {
  defaultVendorId: string | null;
  perFunctionVendor: boolean;
  lineBudget: number | null;
  notes: string;
  rows: {
    eventFunctionId: string;
    vendorId: string | null;
    quantities: Quantities;
    budget: number | null;
  }[];
};

import { z } from 'zod';

// Mirrors the backend's public-form DTOs (Backend/src/modules/public-form/public-form.schema.ts).

export const clientFormSchema = z.object({
  company: z.object({ name: z.string(), logoUrl: z.string().nullable() }),
  state: z.enum(['open', 'locked']),
  submittedAt: z.coerce.date().nullable(),
  sections: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      services: z.array(
        z.object({ id: z.string(), name: z.string(), description: z.string().nullable() }),
      ),
    }),
  ),
  selections: z.array(z.object({ serviceId: z.string(), note: z.string().nullable() })),
});
export type ClientForm = z.infer<typeof clientFormSchema>;
export type ClientFormSection = ClientForm['sections'][number];
export type ClientFormService = ClientFormSection['services'][number];

export const submissionSchema = z.object({
  submittedAt: z.coerce.date(),
  selectedCount: z.number().int(),
});
export type Submission = z.infer<typeof submissionSchema>;

export const NOTE_MAX = 500;

/** Form values: one entry per service id. Unticked services keep their note while hidden. */
export const answersSchema = z
  .object({
    services: z.record(
      z.string(),
      z.object({
        ticked: z.boolean(),
        note: z.string().max(NOTE_MAX, `Keep the note under ${NOTE_MAX} characters`),
      }),
    ),
  })
  .refine((values) => Object.values(values.services).some((service) => service.ticked), {
    message: "Tick at least one service you'd like us to arrange.",
    path: ['root'],
  });
export type Answers = z.infer<typeof answersSchema>;

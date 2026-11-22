import { z } from 'zod';

export const messageSchema = z.object({
  id: z.union([z.string(), z.number()]),
  text: z.string(),
  created_at: z.string(),
});

export const messagesResponseSchema = z.object({ data: z.array(messageSchema) });

export type Message = z.infer<typeof messageSchema>;

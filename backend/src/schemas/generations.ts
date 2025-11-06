import { z } from 'zod';

export const createGenerationBody = z.object({
  prompt: z.string().min(3).max(300),
  style: z.string().min(1).max(40),
});

export type CreateGenerationBody = z.infer<typeof createGenerationBody>;



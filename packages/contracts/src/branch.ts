import { z } from 'zod';

export const BranchSchema = z.object({
  id: z.string(), // null branch normalized to "default"
  name: z.string().nullable(),
  scanlator: z.string().nullable(),
  chaptersCount: z.number(),
  lastUpdatedAt: z.string().datetime().nullable(),
});

export type Branch = z.infer<typeof BranchSchema>;

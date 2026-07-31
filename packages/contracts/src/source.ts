import { z } from 'zod';

export const SourceCapabilitiesSchema = z.object({
  search: z.boolean(),
  tagFilter: z.boolean(),
  sortOrders: z.array(z.string()),
  multipleTags: z.boolean(),
});

export type SourceCapabilities = z.infer<typeof SourceCapabilitiesSchema>;

export const SourceSchema = z.object({
  id: z.string(), // "DESUME"
  title: z.string(),
  locale: z.string(),
  status: z.enum(['ok', 'degraded', 'down']),
  capabilities: SourceCapabilitiesSchema,
});

export type Source = z.infer<typeof SourceSchema>;

import { z } from 'zod';

export const PageSchema = z.object({
  index: z.number(),
  url: z.string(), // /api/v1/img?u=<signed>&s=<sourceId>
  width: z.number().nullable(), // если источник отдаёт — резервируем место
  height: z.number().nullable(),
});

export type Page = z.infer<typeof PageSchema>;

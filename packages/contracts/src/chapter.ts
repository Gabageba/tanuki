import { z } from 'zod';

export const ChapterSchema = z.object({
  id: z.string(), // sourceId + opaqueId, see Title.id — use as-is for routes/API calls
  titleId: z.string(),

  number: z.number().nullable(), // 145.5 — дробные бывают
  volume: z.number().nullable(),
  title: z.string().nullable(),

  branch: z.string().nullable(), // "Команда Ронин" — критично для RU
  scanlator: z.string().nullable(),
  uploadedAt: z.string().datetime().nullable(),

  url: z.string(), // внутренний, наружу не отдаётся как есть
});

export type Chapter = z.infer<typeof ChapterSchema>;

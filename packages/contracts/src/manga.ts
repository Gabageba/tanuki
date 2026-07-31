import { z } from 'zod';
import { TagSchema } from './tag';

export const MangaSchema = z.object({
  id: z.string(), // "READMANGA:solo-leveling"
  sourceId: z.string(),
  slug: z.string(),

  title: z.string(), // локализованное название источника
  altTitles: z.array(z.string()), // оригинал, англ., синонимы

  coverUrl: z.string(), // уже проксированный /api/v1/img?...
  largeCoverUrl: z.string().nullable(),

  description: z.string().nullable(),
  authors: z.array(z.string()),
  tags: z.array(TagSchema),

  state: z.enum(['ONGOING', 'FINISHED', 'PAUSED', 'ABANDONED', 'UPCOMING']).nullable(),
  contentRating: z.enum(['SAFE', 'SUGGESTIVE', 'ADULT']),
  type: z.enum(['MANGA', 'MANHWA', 'MANHUA', 'COMICS', 'OTHER']).nullable(),

  rating: z.number().min(0).max(1).nullable(), // нормализовано к 0..1
  chaptersCount: z.number().nullable(),

  publicUrl: z.string(), // ссылка на страницу источника — обязательна
});

export type Manga = z.infer<typeof MangaSchema>;

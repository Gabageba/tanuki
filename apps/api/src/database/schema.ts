import { index, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import type { MangaLinkVerdict } from '@tanuki/contracts';

/**
 * Ручные правки связей между тайтлами на разных источниках: что человек подтвердил, а что
 * забраковал. Алгоритмические совпадения тут не хранятся — только решения людей, которые
 * накладываются поверх выдачи матчинга.
 */
export const mangaLinks = pgTable(
  'manga_links',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    /**
     * Полные Manga.id обеих сторон («readmanga_ru:eyJpZCI6...»). Пара всегда отсортирована,
     * так что aId < bId — благодаря этому связь читается с обеих сторон одним запросом и не
     * может задвоиться зеркальной записью.
     */
    aId: text('a_id').notNull(),
    bId: text('b_id').notNull(),

    /**
     * Снимок названий на момент правки. Manga.id кодирует адрес тайтла на источнике, поэтому
     * при переезде страницы связь осиротеет — по этим названиям её можно узнать и починить.
     */
    aTitle: text('a_title').notNull(),
    bTitle: text('b_title').notNull(),

    /**
     * Тип text, а не pgEnum: pgEnum требует массива строковых литералов, а в этом проекте
     * литералы объявляются один раз в контрактах (MANGA_LINK_VERDICT) и выводятся типом.
     * Значение проверяется zod-схемой на входе. MANGA_LINK_VERDICT.NONE здесь не хранится —
     * это команда удалить строку.
     */
    verdict: text('verdict').$type<MangaLinkVerdict>().notNull(),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('manga_links_pair_idx').on(table.aId, table.bId),
    index('manga_links_a_idx').on(table.aId),
    index('manga_links_b_idx').on(table.bId),
  ],
);

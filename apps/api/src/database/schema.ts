import { index, integer, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import type { TitleLinkVerdict, SourceStatus, SourceStatusReason } from '@tanuki/contracts';

/**
 * Ручные правки связей между тайтлами на разных источниках: что человек подтвердил, а что
 * забраковал. Алгоритмические совпадения тут не хранятся — только решения людей, которые
 * накладываются поверх выдачи матчинга.
 */
export const titleLinks = pgTable(
  'title_links',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    /**
     * Полные Title.id обеих сторон («readmanga_ru:eyJpZCI6...»). Пара всегда отсортирована,
     * так что aId < bId — благодаря этому связь читается с обеих сторон одним запросом и не
     * может задвоиться зеркальной записью.
     */
    aId: text('a_id').notNull(),
    bId: text('b_id').notNull(),

    /**
     * Снимок названий на момент правки. Title.id кодирует адрес тайтла на источнике, поэтому
     * при переезде страницы связь осиротеет — по этим названиям её можно узнать и починить.
     */
    aName: text('a_name').notNull(),
    bName: text('b_name').notNull(),

    /**
     * Тип text, а не pgEnum: pgEnum требует массива строковых литералов, а в этом проекте
     * литералы объявляются один раз в контрактах (TITLE_LINK_VERDICT) и выводятся типом.
     * Значение проверяется zod-схемой на входе. TITLE_LINK_VERDICT.NONE здесь не хранится —
     * это команда удалить строку.
     */
    verdict: text('verdict').$type<TitleLinkVerdict>().notNull(),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('title_links_pair_idx').on(table.aId, table.bId),
    index('title_links_a_idx').on(table.aId),
    index('title_links_b_idx').on(table.bId),
  ],
);

/**
 * Статус источника — «липкий» и переживающий рестарт, в отличие от circuit breaker'а
 * (SourceHealthService), который живёт в памяти и гасит трафик всего на несколько минут. Строка
 * появляется только когда статус источника перестал быть рабочим по умолчанию: пустая таблица
 * означает «все источники ok».
 *
 * Счётчика успешных живых запросов тут нет намеренно — он держится в памяти
 * SourceStatusService, иначе пришлось бы писать в базу на каждый успешный запрос к каждому
 * источнику. В базу уходят только переходы статуса и итоги ночного прогона.
 */
export const sourceHealth = pgTable('source_health', {
  /** Source.id, а не домен: домены источники меняют, id — стабильный ключ. */
  sourceId: text('source_id').primaryKey(),

  /**
   * Тип text, а не pgEnum, по той же причине, что и title_links.verdict: литералы объявлены
   * один раз в контрактах (SOURCE_STATUS / SOURCE_STATUS_REASON) и выводятся типом.
   */
  status: text('status').$type<SourceStatus>().notNull(),
  reason: text('reason').$type<SourceStatusReason>().notNull(),

  /** Сколько ночных прогонов подряд упало — на третьем статус становится down. */
  failedProbeStreak: integer('failed_probe_streak').notNull().default(0),

  /** Текст последней ошибки — единственное, по чему можно понять, что именно сломалось. */
  lastError: text('last_error'),

  /** Когда по источнику последний раз отработал пробник; null — ещё ни разу. */
  checkedAt: timestamp('checked_at', { withTimezone: true }),

  statusChangedAt: timestamp('status_changed_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

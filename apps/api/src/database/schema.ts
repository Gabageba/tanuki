import { sql } from 'drizzle-orm';
import {
  boolean,
  customType,
  doublePrecision,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import type {
  TitleLinkVerdict,
  SourceStatus,
  SourceStatusReason,
  UserRole,
  Language,
  ReaderReadingMode,
  ReaderPageFit,
  ColorScheme,
  ViewMode,
} from '@tanuki/contracts';
import type { EmailTokenPurpose } from '../auth/models';

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

/**
 * Аккаунты. Регистрация закрыта инвайтами (см. `invites`) — email и username уникальны без
 * учёта регистра, поэтому уникальность обеспечивают индексы по lower(...), а не по самим
 * колонкам: email хранится уже нормализованным (trim + lowercase), а username — как ввёл
 * пользователь, регистр в нём значим только для отображения.
 */
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull(),
    username: text('username').notNull(),
    passwordHash: text('password_hash').notNull(),

    // Тип text, а не pgEnum — см. комментарий у title_links.verdict выше. Литерал объявлен
    // один раз в контрактах (USER_ROLE) и выводится типом.
    role: text('role').$type<UserRole>().notNull(),

    /** null, пока почта не подтверждена — до этого момента вход запрещён. */
    emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),

    /** Язык интерфейса на момент регистрации — на нём уходят письма. */
    language: text('language').$type<Language>().notNull(),

    /**
     * Когда последний раз меняли аватар; null — аватара нет. Живёт здесь, а не только в
     * user_avatars, чтобы собрать ссылку на аватар без лишнего запроса за самими байтами.
     */
    avatarUpdatedAt: timestamp('avatar_updated_at', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('users_email_lower_idx').on(sql`lower(${table.email})`),
    uniqueIndex('users_username_lower_idx').on(sql`lower(${table.username})`),
  ],
);

/**
 * Серверные сессии — не JWT: вход отзывается мгновенно (logout, сброс пароля), достаточно
 * удалить строку. В cookie уходит только случайный токен, здесь хранится его SHA-256 — угнанный
 * дамп таблицы не даёт войти напрямую.
 */
export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull().unique(),

  /** «Запомнить меня»: влияет только на срок cookie и на то, продлевается ли expiresAt. */
  remember: boolean('remember').notNull(),

  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull().defaultNow(),
  userAgent: text('user_agent'),
  ip: text('ip'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Одноразовые приглашения. Статус (active/used/expired/revoked) не хранится отдельной колонкой —
 * он полностью выводится из expiresAt/usedAt/revokedAt, так что вычисляется на чтении
 * (см. auth/invites.mapper.ts), а не рискует разойтись с этими полями.
 */
export const invites = pgTable('invites', {
  id: uuid('id').primaryKey().defaultRandom(),
  /** SHA-256 кода — как и у сессий, сам код существует только в ссылке, которую получил человек. */
  codeHash: text('code_hash').notNull().unique(),
  role: text('role').$type<UserRole>().notNull(),
  /** null для самого первого инвайта — его печатает CLI-скрипт до того, как в базе есть хоть
   *  один пользователь (см. scripts/create-invite.ts). Все следующие инвайты создаёт админ. */
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedBy: uuid('used_by').references(() => users.id, { onDelete: 'set null' }),
  usedAt: timestamp('used_at', { withTimezone: true }),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Настройки читалки — одна строка на пользователя, создаётся при первом сохранении из drawer'а.
 * Пока строки нет, API отдаёт DEFAULT_READER_SETTINGS (@tanuki/contracts), в базу это не пишется.
 */
export const readerSettings = pgTable('reader_settings', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),

  // Тип text, а не pgEnum — см. комментарий у title_links.verdict выше. Литералы объявлены один
  // раз в контрактах (READER_READING_MODE / READER_PAGE_FIT) и выводятся типом.
  readingMode: text('reading_mode').$type<ReaderReadingMode>().notNull(),
  pageFit: text('page_fit').$type<ReaderPageFit>().notNull(),
  containerWidth: integer('container_width').notNull(),
  /** Ширина боковой зоны клика в горизонтальном режиме, в процентах экрана на каждую сторону. */
  tapZoneWidth: integer('tap_zone_width').notNull(),
  /** Отступ между страницами в вертикальном режиме, в пикселях. */
  pageGap: integer('page_gap').notNull(),
  /** Отступ между главами в вертикальной ленте, в пикселях. */
  chapterGap: integer('chapter_gap').notNull(),

  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Настройки, не завязанные на конкретную страницу (тема, вид каталога, язык, отказ от диалога
 * исключающих фильтров) — одна строка на пользователя, создаётся при первом сохранении. Источник
 * истины для гостя — localStorage на клиенте (apps/web/src/shared/lib/settings.ts); эта таблица
 * синхронизирует его для авторизованных между устройствами. Колонки нет смысла делать notNull:
 * партиальная строка значит «остального ещё не сохраняли, на клиенте берём из localStorage».
 */
export const userSettings = pgTable('user_settings', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),

  // Тип text, а не pgEnum — см. комментарий у title_links.verdict выше. Литералы объявлены один
  // раз в контрактах (COLOR_SCHEME / VIEW_MODE) и выводятся типом.
  colorScheme: text('color_scheme').$type<ColorScheme>(),
  viewMode: text('view_mode').$type<ViewMode>(),
  language: text('language').$type<Language>(),
  exclusiveFilterConfirmDismissed: boolean('exclusive_filter_confirm_dismissed'),

  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

const bytea = customType<{ data: Buffer }>({
  dataType: () => 'bytea',
});

/**
 * Аватар пользователя, уже ужатый до webp. Отдельной таблицей, чтобы байты не тянулись в каждый
 * select из users (например, при разборе сессии на каждом запросе).
 */
export const userAvatars = pgTable('user_avatars', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  data: bytea('data').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Где пользователь остановился в тайтле — одна строка на пару «пользователь × тайтл на
 * источнике». Общим для подтверждённых совпадений прогресс делает не таблица, а чтение: API
 * отдаёт строку тайтла вместе со строками всей его группы (TitleLinksService.listConfirmedGroup),
 * а сервер выравнивает их с главами тайтла (reading-progress/chapter-alignment.ts).
 */
export const readingProgress = pgTable(
  'reading_progress',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    /** linkKeyOf(sourceId, url) — тот же ключ, что в title_links, и по той же причине: Title.id
     *  у части парсеров (desume) разный в списке и в деталях. */
    titleKey: text('title_key').notNull(),
    sourceId: text('source_id').notNull(),

    chapterId: text('chapter_id').notNull(),
    /** Снимок тома, номера и названия главы: по нему отметку узнают на других источниках
     *  группы, когда полный список глав её источника недоступен. */
    chapterVolume: doublePrecision('chapter_volume'),
    chapterNumber: doublePrecision('chapter_number'),
    chapterTitle: text('chapter_title'),
    /** Branch.id — имя ветки или DEFAULT_BRANCH_ID, чтобы фронт открыл нужную ветку. */
    branchId: text('branch_id').notNull(),
    pageIndex: integer('page_index').notNull(),

    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.titleKey] })],
);

/** Ссылки в письмах: подтверждение почты и сброс пароля — один токен на активную цель за раз. */
export const emailTokens = pgTable('email_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  purpose: text('purpose').$type<EmailTokenPurpose>().notNull(),
  tokenHash: text('token_hash').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

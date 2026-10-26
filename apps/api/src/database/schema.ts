import { sql } from 'drizzle-orm';
import {
  boolean,
  customType,
  doublePrecision,
  foreignKey,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import type {
  SourceAccountStatus,
  SourceAuthFamily,
  TitleLinkVerdict,
  SourceStatus,
  SourceStatusReason,
  UserRole,
  Language,
  ReaderReadingMode,
  ReaderPageFit,
  ColorScheme,
  ViewMode,
  BuiltInBookmarkFolder,
  BookmarkFolderIcon,
  BookmarkFolderColor,
  ContentRating,
  TitleType,
  NotificationCategory,
  NotificationType,
  RestoreProgressPolicy,
  SourceImportProgressStatus,
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

    /**
     * Когда аккаунт будет удалён окончательно; null — удаление не запрошено. Пока дата не
     * наступила, вход с отменой удаления возвращает аккаунт (см. AuthService.login), а крон
     * (AuthCleanupService) по наступлении удаляет строку со всеми каскадами.
     */
    deletionScheduledAt: timestamp('deletion_scheduled_at', { withTimezone: true }),

    /**
     * Блокировка персоналом: blockedAt — когда заблокировали, null — не заблокирован. blockedUntil
     * null при стоящем blockedAt — навсегда; прошедший blockedUntil значит, что блокировка
     * кончилась сама, поля при этом не чистятся (см. users/managed-users.mapper.ts).
     */
    blockedAt: timestamp('blocked_at', { withTimezone: true }),
    blockedUntil: timestamp('blocked_until', { withTimezone: true }),
    blockReason: text('block_reason'),

    /**
     * Последний вход или активность — пишется при создании сессии и при её продлении (не чаще
     * раза в час). Живёт здесь, а не только в sessions: сессии удаляются при выходе и блокировке,
     * а давность входа должна это пережить. null — ни разу не входил.
     */
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }),

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
  /** Кто отозвал; null у отозванных до появления колонки и если отозвавший уже удалён. */
  revokedBy: uuid('revoked_by').references(() => users.id, { onDelete: 'set null' }),
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
  autoNextChapter: boolean('auto_next_chapter').notNull(),
  hidePanelsOnScroll: boolean('hide_panels_on_scroll').notNull(),

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
  /** IANA-зона («Europe/Moscow»): по ней статистика чтения режет сутки и месяцы. */
  timeZone: text('time_zone'),
  /** Контент 18+: null — действует умолчание из контрактов (DEFAULT_SHOW_ADULT_SOURCES и т.д.). */
  showAdultSources: boolean('show_adult_sources'),
  hideAdultTitles: boolean('hide_adult_titles'),
  /** Пользователь однажды подтвердил, что ему есть 18, — больше не спрашиваем. */
  ageConfirmed: boolean('age_confirmed'),
  /** Писать ли недавние запросы поиска: null — включено (DEFAULT_SAVE_SEARCH_HISTORY). */
  saveSearchHistory: boolean('save_search_history'),
  /** id источников со свёрнутой секцией в выдаче поиска; null — всё развёрнуто. */
  collapsedSearchSources: text('collapsed_search_sources').array(),
  /**
   * Порядок источников, заданный в настройках: id по порядку. Источники, которых здесь нет
   * (новые), встают в конец в порядке каталога. Наружу отдаётся через /sources, не через
   * /user-settings.
   */
  sourceOrder: text('source_order').array(),
  /** Категории уведомлений с выключенным push; null — включены все. */
  pushDisabledCategories: text('push_disabled_categories').array().$type<NotificationCategory[]>(),
  /** Источники, убранные из подборок; null — показываются все. */
  selectionsDisabledSources: text('selections_disabled_sources').array(),
  /** Выключенные блоки подборок — `sourceId:sectionId` (getSelectionsSectionKey); null — все. */
  selectionsDisabledSections: text('selections_disabled_sections').array(),
  /** Порядок блоков подборок — ключи `sourceId:sectionId`; null — порядок сайта. */
  selectionsSectionOrder: text('selections_section_order').array(),

  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Источники, которые пользователь выключил в настройках: они пропадают из его каталога,
 * поиска и совпадений. Хранятся выключенные, а не включённые — новый источник у всех сразу виден.
 */
export const disabledSources = pgTable(
  'disabled_sources',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    sourceId: text('source_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.sourceId] })],
);

/**
 * Личные аккаунты пользователя на источниках. Grouple и AllHentai — одна строка на семейство
 * (sourceId = ''), у LibSocial — строка на каждый источник сети: токены у них свои.
 * Всё секретное хранится только зашифрованным (common/secret-box.ts).
 */
export const sourceAccounts = pgTable(
  'source_accounts',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    /** Аккаунт один на семейство — у LibSocial тоже: токены сайтов сети лежат в его state. */
    family: text('family').$type<SourceAuthFamily>().notNull(),
    status: text('status').$type<SourceAccountStatus>().notNull(),
    /** Имя аккаунта на источнике — для показа в настройках. */
    login: text('login'),
    /** Только если человек разрешил автоматический повторный вход. */
    encryptedPassword: text('encrypted_password'),
    /** Сессия: cookie jar Grouple/AllHentai или токены сайтов LibSocial, в JSON и зашифрованно. */
    encryptedState: text('encrypted_state').notNull(),
    linkedAt: timestamp('linked_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.family] })],
);

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

    /**
     * Снимок тайтла для «Продолжить чтение», как у закладок: карточка рисуется без похода к
     * источнику. Пишет PUT /progress из закешированных деталей; у старых строк null — снимок
     * досниматься при выдаче ленты.
     */
    titleId: text('title_id'),
    titleName: text('title_name'),
    /** Адрес обложки на источнике, без подписи прокси: подпись ставит чтение. */
    coverUrl: text('cover_url'),
    contentRating: text('content_rating').$type<ContentRating>(),
    type: text('type').$type<TitleType>(),
    /**
     * Когда тайтл убрали из «Продолжить чтение»; null — не убирали. Пишется во все строки
     * группы. Тайтл снова в ленте, как только updated_at станет позже — при следующем чтении.
     */
    hiddenAt: timestamp('hidden_at', { withTimezone: true }),

    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.titleKey] }),
    index('reading_progress_user_updated_at_idx').on(table.userId, table.updatedAt.desc()),
  ],
);

/**
 * Прочитанные главы — журнал для статистики. Глава прочитана, когда читатель дошёл до её последней
 * страницы; строка пишется один раз (PK), так что перечитывание дату первого прочтения не
 * сдвигает. Одну главу на разных источниках склеивает уже подсчёт — по связям тайтлов на момент
 * запроса (reading-statistics/statistics.ts), а не запись.
 */
export const chapterReads = pgTable(
  'chapter_reads',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    chapterId: text('chapter_id').notNull(),
    sourceId: text('source_id').notNull(),
    /** linkKeyOf(sourceId, url) — по нему глава находит свою группу в title_links. */
    titleKey: text('title_key').notNull(),
    /** Снимок тома и номера: по ним одна глава узнаётся на связанных источниках. */
    chapterVolume: doublePrecision('chapter_volume'),
    chapterNumber: doublePrecision('chapter_number'),
    /** Названия тегов тайтла на момент прочтения — для разбивки по тегам. */
    tags: text('tags')
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    readAt: timestamp('read_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.chapterId] }),
    index('chapter_reads_user_read_at_idx').on(table.userId, table.readAt),
  ],
);

/**
 * Активное время в читалке, по минутам: строка — минута (UTC), в которой читатель был на месте,
 * и сколько секунд из неё он читал. Из этих минут подсчёт собирает сессии и час пик.
 */
export const readingActivity = pgTable(
  'reading_activity',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    minute: timestamp('minute', { withTimezone: true }).notNull(),
    seconds: smallint('seconds').notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.minute] })],
);

/** Ссылки в письмах: подтверждение почты и сброс пароля — один токен на активную цель за раз. */
export const emailTokens = pgTable('email_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  purpose: text('purpose').$type<EmailTokenPurpose>().notNull(),
  tokenHash: text('token_hash').notNull().unique(),
  /**
   * Данные, которые ссылка применяет: новая почта у CHANGE_EMAIL, прежняя — у
   * REVERT_EMAIL_CHANGE. У остальных назначений null.
   */
  payload: text('payload'),
  /**
   * Неверные вводы кода (CHANGE_EMAIL): после MAX_EMAIL_CODE_ATTEMPTS код гаснет. Счётчик в
   * базе, а не в Redis — лимитер при упавшем Redis пропускает всё, а шесть цифр перебираются.
   */
  attempts: integer('attempts').notNull().default(0),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Папки закладок. Четыре встроенные (builtIn не null) создаются лениво, при первом обращении
 * пользователя к закладкам; их название, иконку и цвет задаёт фронт, поэтому эти колонки у них
 * null. Свои папки (builtIn null) пользователь создаёт, переименовывает и удаляет сам.
 */
export const bookmarkFolders = pgTable(
  'bookmark_folders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    // Тип text, а не pgEnum — см. комментарий у title_links.verdict выше.
    builtIn: text('built_in').$type<BuiltInBookmarkFolder>(),
    name: text('name'),
    icon: text('icon').$type<BookmarkFolderIcon>(),
    color: text('color').$type<BookmarkFolderColor>(),
    /** Место вкладки — по возрастанию. */
    position: integer('position').notNull(),
    /** Проверять ли новые главы закладок этой папки кроном и показывать ли пометку. */
    trackUpdates: boolean('track_updates').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // NULL в уникальном индексе Postgres считает разными значениями — свои папки (builtIn null)
    // и встроенные (name null) друг другу не мешают.
    uniqueIndex('bookmark_folders_user_built_in_idx').on(table.userId, table.builtIn),
    uniqueIndex('bookmark_folders_user_name_lower_idx').on(table.userId, sql`lower(${table.name})`),
  ],
);

/**
 * Закладки — строка на пару «пользователь × тайтл на источнике», как reading_progress. Одной
 * закладкой для пользователя их делает чтение: строки одной группы подтверждённых совпадений
 * (TitleLinksService) показываются и правятся вместе — смена папки и удаление касаются всех.
 */
export const bookmarks = pgTable(
  'bookmarks',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    /** linkKeyOf(sourceId, url) — тот же ключ, что в title_links и reading_progress. */
    titleKey: text('title_key').notNull(),
    sourceId: text('source_id').notNull(),
    /** Полный Title.id — по нему карточка ведёт на тайтл. */
    titleId: text('title_id').notNull(),
    /**
     * Без каскада: что делать с закладками удаляемой папки, решает сервис (перенос или удаление).
     * no action, а не restrict: проверка идёт в конце оператора, так что каскад от users удаляет
     * и папки, и закладки одним махом.
     */
    folderId: uuid('folder_id')
      .notNull()
      .references(() => bookmarkFolders.id, { onDelete: 'no action' }),
    /** Снимок на момент добавления — карточка рисуется и без живого источника. */
    name: text('name').notNull(),
    /** Адрес обложки на источнике, без подписи прокси: подпись живёт час, её ставит чтение. */
    coverUrl: text('cover_url'),
    contentRating: text('content_rating').$type<ContentRating>().notNull(),
    type: text('type').$type<TitleType>(),
    /** Последний визит в группу — общий для неё: пишется во все её строки. */
    visitedAt: timestamp('visited_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    /** Когда последний раз меняли папку: при разошедшихся папках группы побеждает свежая. */
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.titleKey] }),
    index('bookmarks_user_folder_idx').on(table.userId, table.folderId),
  ],
);

/**
 * Когда тайтл последний раз проверяли на новые главы — общая для всех пользователей: тайтл
 * запрашивается у источника один раз, сколько бы человек его ни сохранили.
 */
export const titleChapterSnapshots = pgTable('title_chapter_snapshots', {
  /** linkKeyOf(sourceId, url). */
  titleKey: text('title_key').primaryKey(),
  sourceId: text('source_id').notNull(),
  /** Полный Title.id — по нему крон и меню источников на карточке находят тайтл. */
  titleId: text('title_id').notNull(),
  checkedAt: timestamp('checked_at', { withTimezone: true }).notNull().defaultNow(),
  /** Текст последней ошибки проверки; null — последняя прошла. */
  lastError: text('last_error'),
  /** Источник ответил «не найдено» — тайтл пропал с него. */
  missing: boolean('missing').notNull().default(false),
});

/**
 * Каждая глава, которую хоть раз видели у тайтла, и когда впервые. «Новые» для пользователя —
 * увиденные впервые после его последнего визита. Главы первого снимка помечены baseline: тайтл,
 * проверенный впервые, не должен показать все свои главы новыми.
 */
export const titleChaptersSeen = pgTable(
  'title_chapters_seen',
  {
    titleKey: text('title_key').notNull(),
    /** Chapter.id — «sourceId:opaqueId», как его получает фронт. */
    chapterId: text('chapter_id').notNull(),
    /** Branch.id — имя ветки или DEFAULT_BRANCH_ID, как в reading_progress. */
    branchId: text('branch_id').notNull(),
    chapterVolume: doublePrecision('chapter_volume'),
    chapterNumber: doublePrecision('chapter_number'),
    firstSeenAt: timestamp('first_seen_at', { withTimezone: true }).notNull().defaultNow(),
    baseline: boolean('baseline').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.titleKey, table.chapterId] }),
    index('title_chapters_seen_key_branch_idx').on(table.titleKey, table.branchId),
  ],
);

/**
 * Недавние запросы поиска — до SEARCH_HISTORY_LIMIT на пользователя. Повтор того же запроса
 * (без учёта регистра и лишних пробелов) не плодит строку, а поднимает её и обновляет написание.
 */
export const searchHistory = pgTable(
  'search_history',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    /** Как набрано последним: пробелы схлопнуты, регистр сохранён. */
    query: text('query').notNull(),
    /** Ключ дедупликации — query в нижнем регистре. */
    normalizedQuery: text('normalized_query').notNull(),
    searchedAt: timestamp('searched_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.normalizedQuery] }),
    index('search_history_user_searched_at_idx').on(table.userId, table.searchedAt.desc()),
  ],
);

/**
 * Лента уведомлений. «Прочитано» — это удаление записи, поэтому в таблице только непрочитанное.
 * Уникальна по (userId, groupKey): повторное событие того же рода переписывает запись, а не
 * множит ленту — один тайтл, один источник.
 */
export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').$type<NotificationType>().notNull(),
    /** `chapters:<ключ группы>`, `source:<id>`, `parser:<id>` или `event:<uuid>`. */
    groupKey: text('group_key').notNull(),
    /** Снимок для текста и ссылки; форма зависит от type (NotificationItemSchema). */
    payload: jsonb('payload').$type<Record<string, unknown>>().notNull(),
    count: integer('count').notNull().default(1),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('notifications_user_group_idx').on(table.userId, table.groupKey),
    index('notifications_user_updated_idx').on(table.userId, table.updatedAt),
  ],
);

/** Браузерные подписки на push: по строке на устройство. */
export const pushSubscriptions = pgTable(
  'push_subscriptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    endpoint: text('endpoint').notNull().unique(),
    p256dh: text('p256dh').notNull(),
    auth: text('auth').notNull(),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('push_subscriptions_user_idx').on(table.userId)],
);

/**
 * Устройства, с которых человек уже входил, — чтобы вход с нового устройства попал в ленту.
 * Отпечаток — хэш пары «браузер + ОС» из User-Agent, а не сессии: сессии живут недолго, а
 * устройство не должно становиться «новым» после каждого выхода.
 */
export const knownDevices = pgTable(
  'known_devices',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    fingerprint: text('fingerprint').notNull(),
    /** «Chrome · macOS». */
    label: text('label').notNull(),
    firstSeenAt: timestamp('first_seen_at', { withTimezone: true }).notNull().defaultNow(),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('known_devices_user_fingerprint_idx').on(table.userId, table.fingerprint),
  ],
);

/**
 * Отметки «где остановился», которые импорт из источника достраивает в фоне: у сайта в закладках
 * есть только номер главы, а отметке нужна сама глава — её находит крон по деталям тайтла.
 * Строки одного импорта связаны `importId`; когда ждущих не остаётся, приходит уведомление и
 * строки удаляются. Закладку удалили до достройки — строка уходит вместе с ней.
 */
export const sourceImportProgress = pgTable(
  'source_import_progress',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    importId: uuid('import_id').notNull(),
    sourceId: text('source_id').notNull(),
    titleKey: text('title_key').notNull(),
    titleId: text('title_id').notNull(),
    /** «Где остановился» на сайте — номер главы. */
    chapterNumber: doublePrecision('chapter_number').notNull(),
    progressPolicy: text('progress_policy').$type<RestoreProgressPolicy>().notNull(),
    status: text('status').$type<SourceImportProgressStatus>().notNull(),
    attempts: integer('attempts').notNull().default(0),
    nextAttemptAt: timestamp('next_attempt_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId, table.titleKey],
      foreignColumns: [bookmarks.userId, bookmarks.titleKey],
    }).onDelete('cascade'),
    index('source_import_progress_due_idx').on(table.status, table.nextAttemptAt),
    index('source_import_progress_import_idx').on(table.importId),
  ],
);

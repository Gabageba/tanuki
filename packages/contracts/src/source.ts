import { z } from 'zod';
import type { EnumLiteralsOf } from './utils';

/**
 * Вид контента источника — он же ключ группировки в SourcesResponse. Значения объявлены здесь
 * один раз и переиспользуются парсерами (SOURCE_CATALOG, RawSourceInfo), поэтому API отдаёт их
 * наружу как есть, без приведения регистра.
 */
export const SOURCE_CONTENT_TYPE = {
  MANGA: 'manga',
  HENTAI: 'hentai',
  COMICS: 'comics',
  OTHER: 'other',
} as const;
export type SourceContentType = EnumLiteralsOf<typeof SOURCE_CONTENT_TYPE>;

export const SourceContentTypeSchema = z.enum(SOURCE_CONTENT_TYPE);

export const SOURCE_STATUS = {
  OK: 'ok',
  DEGRADED: 'degraded',
  DOWN: 'down',
} as const;
export type SourceStatus = EnumLiteralsOf<typeof SOURCE_STATUS>;

export const SourceStatusSchema = z.enum(SOURCE_STATUS);

/**
 * Почему источник в своём текущем статусе. Статус «липкий» — он держится, пока его не сменит
 * явное событие, — поэтому без причины по нему нельзя понять, кто его выставил: ночной пробник
 * или живой трафик. Ручного сброса нет намеренно (см. SourceStatusService) — статус меняет
 * только реальный сигнал о состоянии источника, а не человек, нажавший кнопку.
 */
export const SOURCE_STATUS_REASON = {
  /** isBroken в SOURCE_CATALOG — жёсткий оверрайд, автоматика такой источник не трогает. */
  BROKEN: 'broken',
  /** Упала ночная проверка полной цепочки getList → getDetails → getPages. */
  PROBE_FAILED: 'probeFailed',
  /** На живом трафике открылся circuit breaker источника. */
  REQUEST_FAILURES: 'requestFailures',
  /** Источник снова отвечает — успешный пробник или серия успешных живых запросов. */
  RECOVERED: 'recovered',
} as const;
export type SourceStatusReason = EnumLiteralsOf<typeof SOURCE_STATUS_REASON>;

export const SourceStatusReasonSchema = z.enum(SOURCE_STATUS_REASON);

export const SOURCE_LOCALE = {
  RU: 'ru',
  EN: 'en',
} as const;
export type SourceLocale = EnumLiteralsOf<typeof SOURCE_LOCALE>;

export const SourceLocaleSchema = z.enum(SOURCE_LOCALE);

/**
 * Canonical vocabulary of catalog sort orders. Each source only supports a subset — the actual
 * per-source list travels as Source.sortOrders — so this is just the shared key space, not a
 * claim that every source offers every value.
 */
export const SORT_ORDER = {
  UPDATED: 'updated',
  RELEASED: 'released',
  ADDED: 'added',
  POPULARITY: 'popularity',
  RATING: 'rating',
  RATING_COUNT: 'ratingCount',
  LIKES: 'likes',
  COMMENTS: 'comments',
  VIEWS: 'views',
  VIEWS_TODAY: 'viewsToday',
  VIEWS_WEEK: 'viewsWeek',
  VIEWS_MONTH: 'viewsMonth',
  CHAPTERS: 'chapters',
  PAGES: 'pages',
  BOOKMARKS: 'bookmarks',
  ALPHABETICAL: 'alphabetical',
  ALPHABETICAL_RU: 'alphabeticalRu',
  ALPHABETICAL_EN: 'alphabeticalEn',
} as const;
export type SortOrder = EnumLiteralsOf<typeof SORT_ORDER>;

export const SortOrderSchema = z.enum(SORT_ORDER);

/**
 * Whether the source's own catalog actually reverses order for the chosen `SortOrder` — most
 * sources bake a fixed direction into each SORT_ORDER value and ignore `ListParams.direction`.
 */
export const SORT_DIRECTION = {
  ASC: 'asc',
  DESC: 'desc',
} as const;
export type SortDirection = EnumLiteralsOf<typeof SORT_DIRECTION>;

export const SortDirectionSchema = z.enum(SORT_DIRECTION);

/**
 * Аккаунт, которым пользователь открывает источник. Одна учётка обслуживает всё семейство:
 * Grouple — общая SSO сети ReadManga, у AllHentai свой шлюз, у MangaLib и HentaiLib — отдельные аккаунты сайтов,
 * у Nude-Moon, Desu и MangaBuff — аккаунт самого сайта, у сети inuko (Inkstory, PureManga) — сессия сайта поверх общей SSO, у ReManga — токен сессии сайта.
 * Senkuro и Senkognito используют один аккаунт SSO и общий токен.
 * Что именно без аккаунта закрыто — loginRequirement и loginBenefits источника.
 */
export const SOURCE_AUTH_FAMILY = {
  GROUPLE: 'grouple',
  ALLHENTAI: 'allhentai',
  /** SlashLib; также прежний общий ключ MangaLib/HentaiLib до разделения аккаунтов. */
  LIBSOCIAL: 'libsocial',
  MANGALIB: 'mangalib',
  HENTAILIB: 'hentailib',
  NUDEMOON: 'nudemoon',
  DESU: 'desu',
  INUKO: 'inuko',
  MANGABUFF: 'mangabuff',
  REMANGA: 'remanga',
  SENKURO: 'senkuro',
} as const;
export type SourceAuthFamily = EnumLiteralsOf<typeof SOURCE_AUTH_FAMILY>;

export const SourceAuthFamilySchema = z.enum(SOURCE_AUTH_FAMILY);

/** Общий OAuth-движок, но независимые аккаунты и токены сайтов. */
export const isLibSocialAuthFamily = (family: SourceAuthFamily) =>
  family === SOURCE_AUTH_FAMILY.MANGALIB ||
  family === SOURCE_AUTH_FAMILY.HENTAILIB ||
  family === SOURCE_AUTH_FAMILY.LIBSOCIAL;

/**
 * Нужен ли вход, чтобы источник открывался: REQUIRED закрыт, пока пользователь не привяжет свой
 * аккаунт, OPTIONAL читается и без него — анонимно, как гостем на самом сайте.
 */
export const SOURCE_LOGIN_REQUIREMENT = {
  REQUIRED: 'required',
  OPTIONAL: 'optional',
} as const;
export type SourceLoginRequirement = EnumLiteralsOf<typeof SOURCE_LOGIN_REQUIREMENT>;
export const SourceLoginRequirementSchema = z.enum(SOURCE_LOGIN_REQUIREMENT);

/** Что даёт вход на источнике — всё, чего без своего аккаунта у пользователя нет. */
export const SOURCE_LOGIN_BENEFIT = {
  /** Сам источник: без аккаунта он закрыт целиком. Есть у каждого источника с REQUIRED. */
  CATALOG_AND_READING: 'catalogAndReading',
  /** Главы, которые сайт не отдаёт гостю, хотя остальное читается и так. */
  MEMBER_CHAPTERS: 'memberChapters',
  /** Главы, купленные этим аккаунтом. */
  PURCHASED_CHAPTERS: 'purchasedChapters',
  /** Поиск по названию: сайт отдаёт его только вошедшим — без аккаунта источник в поиске закрыт. */
  TITLE_SEARCH: 'titleSearch',
  /**
   * Импорт закладок с сайта. В каталоге не пишется: сервер добавляет его сам каждому источнику,
   * чей парсер умеет `getBookmarks` (`isBookmarksImportSupported`).
   */
  BOOKMARKS_IMPORT: 'bookmarksImport',
} as const;
export type SourceLoginBenefit = EnumLiteralsOf<typeof SOURCE_LOGIN_BENEFIT>;
export const SourceLoginBenefitSchema = z.enum(SOURCE_LOGIN_BENEFIT);

/** Может ли пользователь открыть источник прямо сейчас. */
export const SOURCE_ACCESS = {
  AVAILABLE: 'available',
  /** Нужен свой аккаунт на источнике, а он не привязан. */
  LOCKED: 'locked',
  /** Аккаунт привязан, но его сессия истекла — нужно войти заново. */
  RELOGIN_REQUIRED: 'reloginRequired',
} as const;
export type SourceAccess = EnumLiteralsOf<typeof SOURCE_ACCESS>;
export const SourceAccessSchema = z.enum(SOURCE_ACCESS);

export const SOURCE_ACCOUNT_STATUS = {
  ACTIVE: 'active',
  RELOGIN_REQUIRED: 'reloginRequired',
} as const;
export type SourceAccountStatus = EnumLiteralsOf<typeof SOURCE_ACCOUNT_STATUS>;
export const SourceAccountStatusSchema = z.enum(SOURCE_ACCOUNT_STATUS);

/**
 * Привязанный аккаунт источника — один на семейство. MangaLib и HentaiLib — отдельные
 * семейства: у каждого свои пароль, токен и состояние входа.
 */
export const SourceAccountSchema = z.object({
  family: SourceAuthFamilySchema,
  /** LibSocial — сайт, для которого у аккаунта есть токен. null — открыто всё семейство. */
  sourceIds: z.array(z.string()).nullable(),
  /** Имя аккаунта на источнике — чтобы человек видел, под кем вошёл. */
  login: z.string().nullable(),
  status: SourceAccountStatusSchema,
  /** Пароль сохранён (зашифрованно) — истёкшая сессия восстановится сама. */
  hasSavedPassword: z.boolean(),
  /** `YYYY-MM-DDTHH:MM:SSZ`. */
  linkedAt: z.string(),
});
export type SourceAccount = z.infer<typeof SourceAccountSchema>;

export const SourceAccountsResponseSchema = z.object({
  items: z.array(SourceAccountSchema),
  /** Сервер умеет хранить аккаунты (задан ключ шифрования). false — привязка недоступна. */
  isLinkingAvailable: z.boolean(),
});
export type SourceAccountsResponse = z.infer<typeof SourceAccountsResponseSchema>;

export const LinkSourceAccountRequestSchema = z.object({
  login: z.string().min(1),
  password: z.string().min(1),
  rememberPassword: z.boolean(),
});
export type LinkSourceAccountRequest = z.infer<typeof LinkSourceAccountRequestSchema>;

/** Выбранный сайт для входа, подтверждения или отмены. */
export const LibSocialLoginSourceRequestSchema = z.object({
  sourceId: z.string().min(1),
});

export const LinkLibSocialAccountRequestSchema = LinkSourceAccountRequestSchema.extend(
  LibSocialLoginSourceRequestSchema.shape,
);
export type LinkLibSocialAccountRequest = z.infer<typeof LinkLibSocialAccountRequestSchema>;

/** pendingSourceId — выбранный сайт, который ждёт код из письма; null — вход завершён. */
export const LibSocialLoginStepSchema = z.object({
  pendingSourceId: z.string().nullable(),
});
export type LibSocialLoginStep = z.infer<typeof LibSocialLoginStepSchema>;

/** Сайты LibSocial присылают код из 6 цифр, он действует 10 минут. */
export const LIBSOCIAL_LOGIN_CODE_LENGTH = 6;

export const ConfirmLibSocialLoginRequestSchema = LibSocialLoginSourceRequestSchema.extend({
  /** Код из письма сайта, который ждёт его (LibSocialLoginStep.pendingSourceId). */
  code: z.string().length(LIBSOCIAL_LOGIN_CODE_LENGTH).regex(/^\d+$/),
});
export type ConfirmLibSocialLoginRequest = z.infer<typeof ConfirmLibSocialLoginRequestSchema>;

export const LinkLibSocialTokenRequestSchema = z.object({
  /** Сайт сети, с которого взят токен: у каждого он свой. */
  sourceId: z.string().min(1),
  /** Значение ключа `auth` из localStorage сайта или сам refresh_token. */
  value: z.string().min(1),
});
export type LinkLibSocialTokenRequest = z.infer<typeof LinkLibSocialTokenRequestSchema>;

export const LinkSourceSessionRequestSchema = z.object({
  /** Значение cookie сессии сайта или вся строка `имя=значение`. */
  value: z.string().min(1),
});
export type LinkSourceSessionRequest = z.infer<typeof LinkSourceSessionRequestSchema>;

/** Смысл блока главной — по нему фронт берёт иконку вкладки: названия у сайтов свои, вид общий. */
export const HOME_SECTION_KIND = {
  NEW: 'new',
  TRENDING: 'trending',
  POPULAR: 'popular',
  TOP: 'top',
  UPDATES: 'updates',
} as const;
export type HomeSectionKind = EnumLiteralsOf<typeof HOME_SECTION_KIND>;

export const HomeSectionKindSchema = z.enum(HOME_SECTION_KIND);

/**
 * Вариант блока — вкладка переключателя внутри блока на сайте: период у «Сейчас читают» MangaLib,
 * страна у «Топа тайтлов» Реманги. id стабилен в пределах блока, название — как у сайта.
 */
export const HomeSectionVariantSchema = z.object({
  id: z.string(),
  title: z.string(),
});
export type HomeSectionVariant = z.infer<typeof HomeSectionVariantSchema>;

/**
 * Блок с главной страницы сайта («Горячие новинки», «В тренде»): id стабилен — по нему хранится
 * выбор пользователя (`sourceId:sectionId`), название — как у сайта, без перевода.
 */
export const HomeSectionInfoSchema = z.object({
  id: z.string(),
  title: z.string(),
  kind: HomeSectionKindSchema,
  /** Переключатель внутри блока на сайте; пустой — переключателя нет. Первый — по умолчанию. */
  variants: z.array(HomeSectionVariantSchema),
});
export type HomeSectionInfo = z.infer<typeof HomeSectionInfoSchema>;

export const SourceSchema = z.object({
  id: z.string(), // "desume"
  title: z.string(),
  /**
   * Canonical host, no scheme: "web.usagi.one". Whichever mirror the parser currently talks to
   * — sources rotate domains, so use `id` (not this) as the stable key for anything persisted.
   */
  domain: z.string(),
  locale: SourceLocaleSchema,
  contentType: SourceContentTypeSchema,
  status: SourceStatusSchema,
  /**
   * Кто выставил текущий статус. null — до источника ещё не доходила ни автоматика, ни человек:
   * он просто считается рабочим по умолчанию.
   */
  statusReason: SourceStatusReasonSchema.nullable(),
  /** Когда статус стал текущим, YYYY-MM-DDTHH:MM:SSZ. */
  statusChangedAt: z.string().nullable(),
  /** Когда по источнику последний раз отработал ночной пробник. */
  checkedAt: z.string().nullable(),
  /** Сколько ночных проверок подряд упало — 0 у рабочего источника. */
  failedProbeStreak: z.number(),
  /** Текст ошибки, из-за которой статус стал текущим, — читается на странице здоровья. */
  lastError: z.string().nullable(),
  isAdult: z.boolean(),
  /** Source is blocked for RU IPs and needs a VPN to reach. */
  requiresVpn: z.boolean(),
  /** Empty when the source doesn't support choosing an order — ListParams.order is then ignored. */
  sortOrders: z.array(SortOrderSchema),
  /** True when the source actually reverses order for the chosen SortOrder — most sources ignore
   *  ListParams.direction, so their UI hides the direction toggle entirely. */
  supportsDirection: z.boolean(),
  /** Поиск по названию в каталоге источника сочетается с фильтрами. false — при запросе источник
   *  фильтры не применяет, и клиент не отправляет их, пока запрос набран. */
  isSearchWithFiltersSupported: z.boolean(),
  /** Закладки с сайта можно импортировать — парсер умеет их читать. */
  isBookmarksImportSupported: z.boolean(),
  /** Семейство аккаунта, которым входят на источник; null — входа на источнике нет. */
  authFamily: SourceAuthFamilySchema.nullable(),
  /** Обязателен ли вход с учётом настройки сервера; null — входа на источнике нет. */
  loginRequirement: SourceLoginRequirementSchema.nullable(),
  loginBenefits: z.array(SourceLoginBenefitSchema),
  /** У пользователя есть действующий аккаунт для этого источника. */
  isLoggedIn: z.boolean(),
  /** Место источника в порядке пользователя, с нуля; у гостя — порядок каталога. */
  position: z.number(),
  /** Пользователь не выключил источник в настройках. У гостя всегда true. */
  isEnabled: z.boolean(),
  access: SourceAccessSchema,
  /** Блоки главной сайта в его порядке — для подборок; пустой — у источника нет главной. */
  homeSections: z.array(HomeSectionInfoSchema),
});

export type Source = z.infer<typeof SourceSchema>;

export const UpdateSourceEnabledRequestSchema = z.object({
  isEnabled: z.boolean(),
});
export type UpdateSourceEnabledRequest = z.infer<typeof UpdateSourceEnabledRequestSchema>;

/** Порядок источников пользователя целиком: не названные в нём источники встают в конец. */
export const UpdateSourcesOrderRequestSchema = z.object({
  sourceIds: z.array(z.string()),
});
export type UpdateSourcesOrderRequest = z.infer<typeof UpdateSourcesOrderRequestSchema>;

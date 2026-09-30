import { SOURCE_ID, type EnumLiteralsOf, type SourceId } from '@tanuki/contracts';

export const ACCOUNT_STATE = {
  NONE: 'none',
  ACTIVE: 'active',
  RELOGIN: 'relogin',
} as const;
export type AccountState = EnumLiteralsOf<typeof ACCOUNT_STATE>;

/** Обязателен ли вход, чтобы источник вообще открывался. */
export const LOGIN_REQUIREMENT = {
  REQUIRED: 'required',
  OPTIONAL: 'optional',
} as const;
export type LoginRequirement = EnumLiteralsOf<typeof LOGIN_REQUIREMENT>;

/** Что даёт вход на источнике. */
export const LOGIN_BENEFIT = {
  ADULT_TITLES: 'adultTitles',
  HIDDEN_TITLES: 'hiddenTitles',
  BOOKMARKS_IMPORT: 'bookmarksImport',
} as const;
export type LoginBenefit = EnumLiteralsOf<typeof LOGIN_BENEFIT>;

/** Пометка источника в настройках: вошедшие и источники без входа остаются без неё. */
export const LOGIN_MARK = {
  LOGIN_NEEDED: 'loginNeeded',
  RELOGIN: 'relogin',
  OPTIONAL: 'optional',
} as const;
export type LoginMark = EnumLiteralsOf<typeof LOGIN_MARK>;

/** Где в строке настроек стоит пометка о входе — по варианту на каждое место. */
export const MARK_PLACEMENT = {
  TITLE: 'title',
  DESCRIPTION: 'description',
  ACTION: 'action',
} as const;
export type MarkPlacement = EnumLiteralsOf<typeof MARK_PLACEMENT>;

/** Как вкладка аккаунтов показывает обязательность входа и его пользу. */
export const ACCOUNTS_LAYOUT = {
  ROW_BADGE: 'rowBadge',
  HEADER_SUMMARY: 'headerSummary',
  BENEFIT_ICONS: 'benefitIcons',
} as const;
export type AccountsLayout = EnumLiteralsOf<typeof ACCOUNTS_LAYOUT>;

/** Почему вместо страницы источника или тайтла показан экран «закрыто». */
export const LOCK_REASON = {
  SOURCE: 'source',
  RELOGIN: 'relogin',
  TITLE: 'title',
} as const;
export type LockReason = EnumLiteralsOf<typeof LOCK_REASON>;

/** Шаги импорта с источника: выбор источника, чтение закладок, выбор тайтлов. */
export const IMPORT_STEP = {
  CLOSED: 'closed',
  SOURCE: 'source',
  PARSING: 'parsing',
  TITLES: 'titles',
} as const;
export type ImportStep = EnumLiteralsOf<typeof IMPORT_STEP>;

export const DEMO_FAMILY = {
  GROUPLE: 'grouple',
  ALLHENTAI: 'allhentai',
  LIBSOCIAL: 'libsocial',
  REMANGA: 'remanga',
} as const;
export type DemoFamilyKey = EnumLiteralsOf<typeof DEMO_FAMILY>;

export type DemoFamily = {
  key: DemoFamilyKey;
  title: string;
  state: AccountState;
  login: string;
};

export type DemoSource = {
  id: SourceId;
  title: string;
  domain: string;
  isEnabled: boolean;
  /** null — входа на источнике нет вовсе. */
  login: {
    family: DemoFamilyKey;
    requirement: LoginRequirement;
    benefits: LoginBenefit[];
  } | null;
};

/** По семейству на каждое состояние аккаунта; Реманга — семейство из одного источника. */
export const DEMO_FAMILIES: DemoFamily[] = [
  {
    key: DEMO_FAMILY.GROUPLE,
    title: 'Grouple',
    state: ACCOUNT_STATE.ACTIVE,
    login: 'tanuki_reader',
  },
  { key: DEMO_FAMILY.ALLHENTAI, title: 'AllHentai', state: ACCOUNT_STATE.NONE, login: '' },
  { key: DEMO_FAMILY.LIBSOCIAL, title: 'LibSocial', state: ACCOUNT_STATE.RELOGIN, login: 'tanuki' },
  { key: DEMO_FAMILY.REMANGA, title: 'Реманга', state: ACCOUNT_STATE.NONE, login: '' },
];

/** В порядке, который задал пользователь: сайты одного семейства идут вперемешку с чужими. */
export const DEMO_SOURCES: DemoSource[] = [
  {
    id: SOURCE_ID.MANGALIB,
    title: 'MangaLib',
    domain: 'mangalib.me',
    isEnabled: true,
    login: {
      family: DEMO_FAMILY.LIBSOCIAL,
      requirement: LOGIN_REQUIREMENT.OPTIONAL,
      benefits: [LOGIN_BENEFIT.HIDDEN_TITLES, LOGIN_BENEFIT.BOOKMARKS_IMPORT],
    },
  },
  {
    id: SOURCE_ID.READMANGA_RU,
    title: 'ReadManga',
    domain: 'a.zazaza.me',
    isEnabled: true,
    login: {
      family: DEMO_FAMILY.GROUPLE,
      requirement: LOGIN_REQUIREMENT.REQUIRED,
      benefits: [LOGIN_BENEFIT.BOOKMARKS_IMPORT],
    },
  },
  {
    id: SOURCE_ID.REMANGA,
    title: 'Реманга',
    domain: 'remanga.org',
    isEnabled: true,
    login: {
      family: DEMO_FAMILY.REMANGA,
      requirement: LOGIN_REQUIREMENT.OPTIONAL,
      benefits: [LOGIN_BENEFIT.ADULT_TITLES, LOGIN_BENEFIT.BOOKMARKS_IMPORT],
    },
  },
  {
    id: SOURCE_ID.ALLHENTAI,
    title: 'AllHentai',
    domain: '20.allhen.online',
    isEnabled: true,
    login: {
      family: DEMO_FAMILY.ALLHENTAI,
      requirement: LOGIN_REQUIREMENT.REQUIRED,
      benefits: [LOGIN_BENEFIT.BOOKMARKS_IMPORT],
    },
  },
  {
    id: SOURCE_ID.HENTAILIB,
    title: 'HentaiLib',
    domain: 'hentailib.me',
    isEnabled: true,
    login: {
      family: DEMO_FAMILY.LIBSOCIAL,
      requirement: LOGIN_REQUIREMENT.REQUIRED,
      benefits: [LOGIN_BENEFIT.BOOKMARKS_IMPORT],
    },
  },
  { id: SOURCE_ID.DESUME, title: 'Desu', domain: 'desu.uno', isEnabled: true, login: null },
  {
    id: SOURCE_ID.MINTMANGA,
    title: 'MintManga',
    domain: '2.mintmanga.one',
    isEnabled: false,
    login: {
      family: DEMO_FAMILY.GROUPLE,
      requirement: LOGIN_REQUIREMENT.REQUIRED,
      benefits: [LOGIN_BENEFIT.BOOKMARKS_IMPORT],
    },
  },
];

export type DemoImportTitle = {
  id: string;
  title: string;
  status: string;
  /** В закладках уже есть подтверждённая копия — импорт добавит к ней источник, а не дубль. */
  isInBookmarks: boolean;
};

export const DEMO_IMPORT_TITLES: DemoImportTitle[] = [
  { id: 'berserk', title: 'Берсерк', status: 'Читаю', isInBookmarks: false },
  { id: 'vagabond', title: 'Бродяга', status: 'Читаю', isInBookmarks: true },
  { id: 'dorohedoro', title: 'Дорохедоро', status: 'В планах', isInBookmarks: false },
  { id: 'monster', title: 'Монстр', status: 'Прочитано', isInBookmarks: false },
  { id: 'pluto', title: 'Плутон', status: 'Брошено', isInBookmarks: true },
];

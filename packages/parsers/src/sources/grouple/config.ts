import { SOURCE_ID } from '../catalog';

/** Жанровая вкладка карусели «Тренды»: сайт подгружает её по клику из
 *  `/internal/elementList/<elementId>`. */
export type GroupleTrendTab = {
  elementId: number;
  title: string;
};

export type GroupleConfig = {
  id: string;
  /** SSO site id, used to build the login/authUrl for this specific site. */
  siteId: number;
  /** SSO gateway host. AllHentai uses a separate gateway (z.qawa.org) from the rest of the network. */
  authGateway: string;
  isNsfw: boolean;
  /** AllHentai also accepts this cookie name as proof of auth, in addition to `gwt`. */
  extraAuthCookies?: string[];
  /** Жанровые вкладки «Трендов» после «Горячих новинок» и «Обновления популярного» — набор у
   *  каждого сайта свой (проверено вживую 2026-10-13). */
  trendTabs?: GroupleTrendTab[];
};

const READMANGA_TREND_TABS: GroupleTrendTab[] = [
  { elementId: 9795, title: 'На экранах' },
  { elementId: 2134, title: 'Сёнэн' },
  { elementId: 2122, title: 'Сёдзё' },
  { elementId: 2136, title: 'Комедия' },
  { elementId: 2118, title: 'Драма' },
  { elementId: 2135, title: 'Повседневность' },
];

export const MAIN_AUTH_GATEWAY = '3.grouple.co';

// title/domains live in SOURCE_CATALOG (../catalog) — look them up by id, don't duplicate here.
export const GROUPLE_CONFIGS: GroupleConfig[] = [
  {
    id: SOURCE_ID.READMANGA_RU,
    siteId: 1,
    authGateway: MAIN_AUTH_GATEWAY,
    isNsfw: false,
    trendTabs: READMANGA_TREND_TABS,
  },
  {
    id: SOURCE_ID.MINTMANGA,
    siteId: 2,
    authGateway: MAIN_AUTH_GATEWAY,
    isNsfw: false,
    trendTabs: [
      { elementId: 1313, title: 'Романтика' },
      { elementId: 1328, title: 'Комедия' },
      { elementId: 1315, title: 'Женщины' },
      { elementId: 1320, title: 'Девушки' },
    ],
  },
  {
    id: SOURCE_ID.SELFMANGA,
    siteId: 3,
    authGateway: MAIN_AUTH_GATEWAY,
    isNsfw: false,
    trendTabs: [
      { elementId: 6014, title: 'Продвинутый' },
      { elementId: 6013, title: 'Начинающий' },
    ],
  },
  {
    id: SOURCE_ID.SEIMANGA,
    siteId: 21,
    authGateway: MAIN_AUTH_GATEWAY,
    isNsfw: false,
    trendTabs: [
      { elementId: 6827, title: 'На экранах' },
      { elementId: 1350, title: 'Сверхъестественное' },
      { elementId: 1317, title: 'Ужасы' },
      { elementId: 1346, title: 'Боевик' },
      { elementId: 1313, title: 'Романтика' },
    ],
  },
  {
    id: SOURCE_ID.USAGI,
    siteId: 1,
    authGateway: MAIN_AUTH_GATEWAY,
    isNsfw: false,
    trendTabs: READMANGA_TREND_TABS,
  },
  {
    id: SOURCE_ID.ALLHENTAI,
    siteId: 1,
    // qawa.org itself now 301s here; posting straight to qawa.org loses the login form body
    // because the HTTP client's redirect handling downgrades POST to GET on 301 (like a browser).
    authGateway: 'z.qawa.org',
    isNsfw: true,
    extraAuthCookies: ['remember_me'],
    trendTabs: [
      { elementId: 87, title: 'Гарем' },
      { elementId: 5679, title: 'Зрелые женщины' },
      { elementId: 74, title: 'Романтика' },
      { elementId: 70, title: 'Фэнтези' },
      { elementId: 291, title: 'Измена' },
    ],
  },
];

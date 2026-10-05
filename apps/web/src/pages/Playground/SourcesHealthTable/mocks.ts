import {
  SOURCE_CONTENT_TYPE,
  SOURCE_ID,
  SOURCE_STATUS,
  SOURCE_STATUS_REASON,
} from '@tanuki/contracts';
import { NIGHT_RESULT, type MockSource, type Night } from './models';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

const hoursAgo = (hours: number) => new Date(Date.now() - hours * HOUR).toISOString();
const daysAgo = (days: number) => new Date(Date.now() - days * DAY).toISOString();

const NIGHTS_COUNT = 30;

/** 30 ночей: все прошли, кроме перечисленных (номер с конца, 0 — прошлая ночь). */
const nightsWith = (failedFromEnd: number[] = [], missingFromEnd: number[] = []): Night[] =>
  Array.from({ length: NIGHTS_COUNT }, (_, index) => {
    const fromEnd = NIGHTS_COUNT - 1 - index;
    const date = daysAgo(fromEnd);
    if (missingFromEnd.includes(fromEnd)) return { date, result: NIGHT_RESULT.NONE };
    if (failedFromEnd.includes(fromEnd)) return { date, result: NIGHT_RESULT.FAILED };
    return { date, result: NIGHT_RESULT.PASSED };
  });

const range = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, index) => from + index);

const CLOUDFLARE_ERROR = `SourceBlockedError: anti-bot challenge on GET https://remanga.org/api/v2/search/catalog/?ordering=-rating&page=1
HTTP 403 Forbidden
server: cloudflare
cf-mitigated: challenge
<!DOCTYPE html><html lang="en-US"><head><title>Just a moment...</title><meta http-equiv="refresh" content="390"><meta name="robots" content="noindex,nofollow"><script src="/cdn-cgi/challenge-platform/h/g/orchestrate/chl_page/v1?ray=8c1f2a7e3b9d4f10"></script></head><body><div class="main-wrapper" role="main"><div class="main-content"><h1 class="zone-name-title h1">remanga.org</h1><h2 class="h2" id="challenge-running">Checking if the site connection is secure</h2></div></div></body></html>`;

const STACK_ERROR = `TypeError: Cannot read properties of undefined (reading 'chapters')
    at parseDetails (packages/parsers/src/sources/mangabuff/details.ts:48:31)
    at MangaBuffParser.getDetails (packages/parsers/src/sources/mangabuff/index.ts:112:12)
    at async runSourceContract (packages/parsers/src/core/source-contract.ts:37:21)
    at async SourceProbeService.probeOne (apps/api/src/source-probe/source-probe.service.ts:64:7)`;

/** Все статусы × причины, ни разу не проверявшийся, длинная ошибка и длинное название. Порядок
 *  перемешан — его наводит сортировка таблицы. */
export const MOCK_SOURCES: MockSource[] = [
  {
    id: SOURCE_ID.READMANGA_RU,
    title: 'ReadManga',
    domain: 'web.readmanga.live',
    contentType: SOURCE_CONTENT_TYPE.MANGA,
    status: SOURCE_STATUS.OK,
    statusReason: SOURCE_STATUS_REASON.RECOVERED,
    statusChangedAt: daysAgo(4),
    checkedAt: hoursAgo(7),
    failedProbeStreak: 0,
    lastError: null,
    nights: nightsWith([5, 6]),
  },
  {
    id: SOURCE_ID.REMANGA,
    title: 'Реманга',
    domain: 'remanga.org',
    contentType: SOURCE_CONTENT_TYPE.MANGA,
    status: SOURCE_STATUS.DOWN,
    statusReason: SOURCE_STATUS_REASON.PROBE_FAILED,
    statusChangedAt: daysAgo(1),
    checkedAt: hoursAgo(7),
    failedProbeStreak: 3,
    lastError: CLOUDFLARE_ERROR,
    nights: nightsWith([0, 1, 2, 14]),
  },
  {
    id: SOURCE_ID.MANGALIB,
    title: 'MangaLib',
    domain: 'mangalib.me',
    contentType: SOURCE_CONTENT_TYPE.MANGA,
    status: SOURCE_STATUS.OK,
    statusReason: null,
    statusChangedAt: null,
    checkedAt: hoursAgo(7),
    failedProbeStreak: 0,
    lastError: null,
    nights: nightsWith(),
  },
  {
    id: SOURCE_ID.MANGABUFF,
    title: 'MangaBuff',
    domain: 'mangabuff.ru',
    contentType: SOURCE_CONTENT_TYPE.MANGA,
    status: SOURCE_STATUS.DEGRADED,
    statusReason: SOURCE_STATUS_REASON.PROBE_FAILED,
    statusChangedAt: hoursAgo(7),
    checkedAt: hoursAgo(7),
    failedProbeStreak: 1,
    lastError: STACK_ERROR,
    nights: nightsWith([0]),
  },
  {
    id: SOURCE_ID.HENCHAN,
    title: 'Хентай-тян',
    domain: 'xxxxx.hentaichan.live',
    contentType: SOURCE_CONTENT_TYPE.HENTAI,
    status: SOURCE_STATUS.DOWN,
    statusReason: SOURCE_STATUS_REASON.BROKEN,
    statusChangedAt: daysAgo(41),
    checkedAt: null,
    failedProbeStreak: 0,
    lastError: null,
    nights: nightsWith([], range(0, 29)),
  },
  {
    id: SOURCE_ID.SENKURO,
    title: 'Senkuro',
    domain: 'senkuro.com',
    contentType: SOURCE_CONTENT_TYPE.MANGA,
    status: SOURCE_STATUS.DEGRADED,
    statusReason: SOURCE_STATUS_REASON.REQUEST_FAILURES,
    statusChangedAt: hoursAgo(2),
    checkedAt: hoursAgo(7),
    failedProbeStreak: 0,
    lastError:
      'SourceUnavailableError: GET https://api.senkuro.com/graphql — ETIMEDOUT after 15000 ms',
    nights: nightsWith([9, 10, 20]),
  },
  {
    id: SOURCE_ID.ACOMICS,
    title: 'AComics',
    domain: 'acomics.ru',
    contentType: SOURCE_CONTENT_TYPE.COMICS,
    status: SOURCE_STATUS.OK,
    statusReason: null,
    statusChangedAt: null,
    checkedAt: hoursAgo(7),
    failedProbeStreak: 0,
    lastError: null,
    nights: nightsWith([], range(18, 29)),
  },
  {
    id: SOURCE_ID.MULTPORN_HENTAI,
    title: 'MultPorn Hentai',
    domain: 'multporn.net',
    contentType: SOURCE_CONTENT_TYPE.HENTAI,
    status: SOURCE_STATUS.OK,
    statusReason: null,
    statusChangedAt: null,
    checkedAt: null,
    failedProbeStreak: 0,
    lastError: null,
    nights: nightsWith([], range(0, 29)),
  },
  {
    id: SOURCE_ID.COMX,
    title: 'Com-X',
    domain: 'com-x.life',
    contentType: SOURCE_CONTENT_TYPE.COMICS,
    status: SOURCE_STATUS.DOWN,
    statusReason: SOURCE_STATUS_REASON.PROBE_FAILED,
    statusChangedAt: daysAgo(9),
    checkedAt: hoursAgo(7),
    failedProbeStreak: 11,
    lastError: 'SourceUnavailableError: getaddrinfo ENOTFOUND com-x.life',
    nights: nightsWith(range(0, 10)),
  },
  {
    id: SOURCE_ID.TOMILOLIB,
    title: 'TomiloLib',
    domain: 'tomilolib.me',
    contentType: SOURCE_CONTENT_TYPE.MANGA,
    status: SOURCE_STATUS.OK,
    statusReason: SOURCE_STATUS_REASON.RECOVERED,
    statusChangedAt: hoursAgo(30),
    checkedAt: hoursAgo(7),
    failedProbeStreak: 0,
    lastError: null,
    nights: nightsWith([2, 3]),
  },
  {
    id: SOURCE_ID.NUDEMOON,
    title: 'Nude-Moon',
    domain: 'nude-moon.org',
    contentType: SOURCE_CONTENT_TYPE.HENTAI,
    status: SOURCE_STATUS.OK,
    statusReason: null,
    statusChangedAt: null,
    checkedAt: hoursAgo(7),
    failedProbeStreak: 0,
    lastError: null,
    nights: nightsWith([22]),
  },
];

/** Для карточки D*: лежащий с длинной ошибкой, рабочий и ни разу не проверявшийся. */
export const DRAWER_SAMPLE_IDS: string[] = [
  SOURCE_ID.REMANGA,
  SOURCE_ID.READMANGA_RU,
  SOURCE_ID.MULTPORN_HENTAI,
];

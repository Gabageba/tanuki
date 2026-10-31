import type { TFunction } from 'i18next';
import type { ContentRating, TitleType, SourceLocale } from '@tanuki/contracts';
import {
  CONTENT_RATING,
  SEARCH_GROUP_STATUS,
  TITLE_TYPE,
  SOURCE_CONTENT_TYPE,
  SOURCE_LOCALE,
  SOURCE_STATUS,
  SOURCE_STATUS_REASON,
  SOURCE_ACCESS,
  SOURCE_LOGIN_BENEFIT,
  SOURCE_LOGIN_REQUIREMENT,
  SOURCE_CATALOG,
  type CatalogEntry,
  type Source,
  type SourceAccess,
  type SourceLoginBenefit,
  type SourceContentType,
  type SourcesResponse,
  type SourceStatus,
  type SourceStatusReason,
} from '@tanuki/contracts';
import { STATUS_DEGRADED_COLOR, STATUS_DOWN_COLOR, STATUS_OK_COLOR } from '@/shared/lib/palette';
import { SOURCE_LOGIN_MARK, type MissStatus, type SourceLoginMark } from './models';

/**
 * /sources отдаёт группы по contentType — для поиска источника по id нужен плоский список.
 * Порядок пользователя верен лишь внутри группы, поэтому сквозной восстанавливается по position.
 */
export const flattenSources = (data?: SourcesResponse): Source[] => {
  return Object.values(data ?? [])
    .flat()
    .sort((a, b) => a.position - b.position);
};

/**
 * Только включённые пользователем источники, в тех же группах. Выключенные нужны лишь
 * настройкам (включить обратно) и странице здоровья — остальным экранам их не показывают.
 */
export const getEnabledSources = (data?: SourcesResponse): SourcesResponse | undefined => {
  if (!data) return data;
  return Object.fromEntries(
    Object.entries(data).map(([contentType, sources]) => [
      contentType,
      sources.filter((source) => source.isEnabled),
    ]),
  ) as SourcesResponse;
};

/** Подпись замка закрытого источника; у доступного замка нет. */
export const getSourceAccessLabel = (access: SourceAccess, t: TFunction) => {
  switch (access) {
    case SOURCE_ACCESS.LOCKED:
      return t('loginRequired');
    case SOURCE_ACCESS.RELOGIN_REQUIRED:
      return t('reloginRequired');
  }
};

/** Истёкшая сессия важнее требования: войти заново нужно при любом из них. */
export const getSourceLoginMark = ({
  access,
  loginRequirement,
}: Source): SourceLoginMark | null => {
  if (access === SOURCE_ACCESS.RELOGIN_REQUIRED) return SOURCE_LOGIN_MARK.RELOGIN;
  switch (loginRequirement) {
    case SOURCE_LOGIN_REQUIREMENT.REQUIRED:
      return SOURCE_LOGIN_MARK.REQUIRED;
    case SOURCE_LOGIN_REQUIREMENT.OPTIONAL:
      return SOURCE_LOGIN_MARK.OPTIONAL;
    case null:
      return null;
  }
};

/** Пометки, которые есть у источников, — в порядке `SOURCE_LOGIN_MARK`, для легенды. */
export const getPresentSourceLoginMarks = (sources: Source[]) => {
  const marks = sources.map(getSourceLoginMark);
  return Object.values(SOURCE_LOGIN_MARK).filter((mark) => marks.includes(mark));
};

export const getSourceLoginMarkColor = (mark: SourceLoginMark) => {
  switch (mark) {
    case SOURCE_LOGIN_MARK.REQUIRED:
      return 'red';
    case SOURCE_LOGIN_MARK.OPTIONAL:
      return 'gray';
    case SOURCE_LOGIN_MARK.RELOGIN:
      return STATUS_DEGRADED_COLOR;
  }
};

export const getSourceLoginMarkLabel = (mark: SourceLoginMark, t: TFunction) => {
  switch (mark) {
    case SOURCE_LOGIN_MARK.REQUIRED:
      return t('loginIsMandatory');
    case SOURCE_LOGIN_MARK.OPTIONAL:
      return t('loginIsOptional');
    case SOURCE_LOGIN_MARK.RELOGIN:
      return t('reloginRequired');
  }
};

export const getSourceLoginBenefitLabel = (benefit: SourceLoginBenefit, t: TFunction) => {
  switch (benefit) {
    case SOURCE_LOGIN_BENEFIT.CATALOG_AND_READING:
      return t('catalogAndChapterReading');
    case SOURCE_LOGIN_BENEFIT.MEMBER_CHAPTERS:
      return t('chaptersForRegisteredOnly');
    case SOURCE_LOGIN_BENEFIT.PURCHASED_CHAPTERS:
      return t('purchasedChapters');
    case SOURCE_LOGIN_BENEFIT.TITLE_SEARCH:
      return t('titleSearch');
    case SOURCE_LOGIN_BENEFIT.BOOKMARKS_IMPORT:
      return t('bookmarksImport');
  }
};

export const getSourceStatusColor = (status: SourceStatus) => {
  switch (status) {
    case SOURCE_STATUS.OK:
      return STATUS_OK_COLOR;
    case SOURCE_STATUS.DEGRADED:
      return STATUS_DEGRADED_COLOR;
    case SOURCE_STATUS.DOWN:
      return STATUS_DOWN_COLOR;
  }
};

export const getSourceStatusLabel = (status: SourceStatus, t: TFunction) => {
  switch (status) {
    case SOURCE_STATUS.OK:
      return t('online');
    case SOURCE_STATUS.DEGRADED:
      return t('unstable');
    case SOURCE_STATUS.DOWN:
      return t('unavailable');
  }
};

export const getSourceStatusReasonLabel = (statusReason: SourceStatusReason, t: TFunction) => {
  switch (statusReason) {
    case SOURCE_STATUS_REASON.BROKEN:
      return t('sourceNotParsing');
    case SOURCE_STATUS_REASON.PROBE_FAILED:
      return t('nightlyCheckFailed');
    case SOURCE_STATUS_REASON.REQUEST_FAILURES:
      return t('requestsFailing');
    case SOURCE_STATUS_REASON.RECOVERED:
      return t('sourceRespondingAgain');
  }
};

export const getLabelByContentType = (contentType: SourceContentType, t: TFunction) => {
  switch (contentType) {
    case SOURCE_CONTENT_TYPE.MANGA:
      return t('mangaAndManhwa');
    case SOURCE_CONTENT_TYPE.HENTAI:
      return t('hentai');
    case SOURCE_CONTENT_TYPE.COMICS:
      return t('comics');
    case SOURCE_CONTENT_TYPE.OTHER:
      return t('other');
  }
};

export const getLabelByTitleType = (titleType: TitleType | null, t: TFunction) => {
  if (!titleType) {
    return null;
  }

  switch (titleType) {
    case TITLE_TYPE.MANGA:
      return t('manga');
    case TITLE_TYPE.MANHUA:
      return t('manhua');
    case TITLE_TYPE.MANHWA:
      return t('manhwa');
    case TITLE_TYPE.COMICS:
      return t('comic');
    case TITLE_TYPE.OTHER:
      return t('other');
  }
};

export const getLabelByContentRating = (contentRating: ContentRating) => {
  switch (contentRating) {
    case CONTENT_RATING.SAFE:
      return '0+';
    case CONTENT_RATING.SUGGESTIVE:
      return '16+';
    case CONTENT_RATING.ADULT:
      return '18+';
  }
};

export const getColorByContentRating = (contentRating: ContentRating) => {
  switch (contentRating) {
    case CONTENT_RATING.SAFE:
      return STATUS_OK_COLOR;
    case CONTENT_RATING.SUGGESTIVE:
      return STATUS_DEGRADED_COLOR;
    case CONTENT_RATING.ADULT:
      return STATUS_DOWN_COLOR;
  }
};

export const getFlagByLocale = (locale: SourceLocale) => {
  switch (locale) {
    case SOURCE_LOCALE.RU:
      return '🇷🇺';
    case SOURCE_LOCALE.EN:
      return '🇺🇸';
  }
};

/** Название источника по каталогу; незнакомый id (источник убрали) — как есть, без падения. */
export const getCatalogSourceTitle = (sourceId: string) =>
  (SOURCE_CATALOG as Record<string, CatalogEntry | undefined>)[sourceId]?.title ?? sourceId;

/**
 * Поиск по названию закрыт: каталог открыт и гостю, а поиск сайт отдаёт только вошедшим. Выгода
 * входа берётся из каталога, так что до ответа /sources поиск у такого источника считается
 * закрытым — запрос с query без сессии не уходит.
 */
export const isTitleSearchLocked = (sourceId: string, source: Source | undefined) =>
  !!(SOURCE_CATALOG as Record<string, CatalogEntry | undefined>)[sourceId]?.loginBenefits.includes(
    SOURCE_LOGIN_BENEFIT.TITLE_SEARCH,
  ) && !source?.isLoggedIn;

/** Почему источник не ответил — строка «Не ответили» в поиске и пустые подборки. */
export const getMissReasonLabel = (status: MissStatus, t: TFunction) => {
  switch (status) {
    case SEARCH_GROUP_STATUS.TIMEOUT:
      return t('timedOut');
    case SEARCH_GROUP_STATUS.ERROR:
      return t('error');
    case SEARCH_GROUP_STATUS.LOCKED:
      return t('loginRequired');
    case SEARCH_GROUP_STATUS.UNAVAILABLE:
      return t('unavailable');
  }
};

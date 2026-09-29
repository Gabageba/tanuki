import type { TFunction } from 'i18next';
import type { ContentRating, TitleType, SourceLocale } from '@tanuki/contracts';
import {
  CONTENT_RATING,
  TITLE_TYPE,
  SOURCE_CONTENT_TYPE,
  SOURCE_LOCALE,
  SOURCE_STATUS,
  SOURCE_STATUS_REASON,
  SOURCE_ACCESS,
  type Source,
  type SourceAccess,
  type SourceContentType,
  type SourcesResponse,
  type SourceStatus,
  type SourceStatusReason,
} from '@tanuki/contracts';
import { STATUS_DEGRADED_COLOR, STATUS_DOWN_COLOR, STATUS_OK_COLOR } from '@/shared/lib/palette';

/** /sources отдаёт группы по contentType — для поиска источника по id нужен плоский список. */
export const flattenSources = (data?: SourcesResponse): Source[] => {
  return Object.values(data ?? []).flat();
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

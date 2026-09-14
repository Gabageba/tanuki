import type { TFunction } from 'i18next';
import type { MangaType, SourceLocale } from '@tanuki/contracts';
import {
  MANGA_TYPE,
  SOURCE_CONTENT_TYPE,
  SOURCE_LOCALE,
  SOURCE_STATUS,
  SOURCE_STATUS_REASON,
  type Source,
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

export const getLabelByMangaType = (mangaType: MangaType, t: TFunction) => {
  switch (mangaType) {
    case MANGA_TYPE.MANGA:
      return t('manga');
    case MANGA_TYPE.MANHUA:
      return t('manhua');
    case MANGA_TYPE.MANHWA:
      return t('manhwa');
    case MANGA_TYPE.COMICS:
      return t('comic');
    case MANGA_TYPE.OTHER:
      return t('other');
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

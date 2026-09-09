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

export const getSourceStatusLabel = (status: SourceStatus) => {
  switch (status) {
    case SOURCE_STATUS.OK:
      return 'онлайн';
    case SOURCE_STATUS.DEGRADED:
      return 'нестабилен';
    case SOURCE_STATUS.DOWN:
      return 'недоступен';
  }
};

export const getSourceStatusReasonLabel = (statusReason: SourceStatusReason) => {
  switch (statusReason) {
    case SOURCE_STATUS_REASON.BROKEN:
      return 'источник не парсится в принципе';
    case SOURCE_STATUS_REASON.PROBE_FAILED:
      return 'упала ночная проверка';
    case SOURCE_STATUS_REASON.REQUEST_FAILURES:
      return 'запросы перестали проходить';
    case SOURCE_STATUS_REASON.RECOVERED:
      return 'источник снова отвечает';
  }
};

export const getLabelByContentType = (contentType: SourceContentType) => {
  switch (contentType) {
    case SOURCE_CONTENT_TYPE.MANGA:
      return 'Манга и манхва';
    case SOURCE_CONTENT_TYPE.HENTAI:
      return 'Хентай';
    case SOURCE_CONTENT_TYPE.COMICS:
      return 'Комиксы';
    case SOURCE_CONTENT_TYPE.OTHER:
      return 'Прочее';
  }
};

export const getLabelByMangaType = (mangaType: MangaType) => {
  switch (mangaType) {
    case MANGA_TYPE.MANGA:
      return 'Манга';
    case MANGA_TYPE.MANHUA:
      return 'Маньхуа';
    case MANGA_TYPE.MANHWA:
      return 'Манхва';
    case MANGA_TYPE.COMICS:
      return 'Комикс';
    case MANGA_TYPE.OTHER:
      return 'Другое';
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

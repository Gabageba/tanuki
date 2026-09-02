import type { MangaType } from '@tanuki/contracts';
import {
  MANGA_TYPE,
  SOURCE_CONTENT_TYPE,
  SOURCE_STATUS,
  type Source,
  type SourceContentType,
  type SourcesResponse,
  type SourceStatus,
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

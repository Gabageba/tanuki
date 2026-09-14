import type { TFunction } from 'i18next';
import { MANGA_STATE, type MangaState } from '@tanuki/contracts';
import { STATUS_DEGRADED_COLOR, STATUS_DOWN_COLOR, STATUS_OK_COLOR } from '@/shared/lib/palette';

export const getMangaStateColor = (state: MangaState) => {
  switch (state) {
    case MANGA_STATE.ONGOING:
      return STATUS_OK_COLOR;
    case MANGA_STATE.FINISHED:
      return 'blue';
    case MANGA_STATE.PAUSED:
      return STATUS_DEGRADED_COLOR;
    case MANGA_STATE.ABANDONED:
      return STATUS_DOWN_COLOR;
    case MANGA_STATE.UPCOMING:
      return 'gray';
  }
};

export const getMangaStateLabel = (state: MangaState, t: TFunction) => {
  switch (state) {
    case MANGA_STATE.ONGOING:
      return t('ongoing');
    case MANGA_STATE.FINISHED:
      return t('finished');
    case MANGA_STATE.PAUSED:
      return t('paused');
    case MANGA_STATE.ABANDONED:
      return t('abandoned');
    case MANGA_STATE.UPCOMING:
      return t('announcement');
  }
};

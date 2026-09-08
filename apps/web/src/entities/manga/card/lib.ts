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

export const getMangaStateLabel = (state: MangaState) => {
  switch (state) {
    case MANGA_STATE.ONGOING:
      return 'Выходит';
    case MANGA_STATE.FINISHED:
      return 'Завершён';
    case MANGA_STATE.PAUSED:
      return 'Приостановлен';
    case MANGA_STATE.ABANDONED:
      return 'Заброшен';
    case MANGA_STATE.UPCOMING:
      return 'Анонс';
  }
};

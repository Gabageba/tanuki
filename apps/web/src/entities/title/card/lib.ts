import type { TFunction } from 'i18next';
import { TITLE_STATE, type TitleState } from '@tanuki/contracts';
import { STATUS_DEGRADED_COLOR, STATUS_DOWN_COLOR, STATUS_OK_COLOR } from '@/shared/lib/palette';

export const getTitleStateColor = (state: TitleState) => {
  switch (state) {
    case TITLE_STATE.ONGOING:
      return STATUS_OK_COLOR;
    case TITLE_STATE.FINISHED:
      return 'blue';
    case TITLE_STATE.PAUSED:
      return STATUS_DEGRADED_COLOR;
    case TITLE_STATE.ABANDONED:
      return STATUS_DOWN_COLOR;
    case TITLE_STATE.UPCOMING:
      return 'gray';
  }
};

export const getTitleStateLabel = (state: TitleState, t: TFunction) => {
  switch (state) {
    case TITLE_STATE.ONGOING:
      return t('ongoing');
    case TITLE_STATE.FINISHED:
      return t('finished');
    case TITLE_STATE.PAUSED:
      return t('paused');
    case TITLE_STATE.ABANDONED:
      return t('abandoned');
    case TITLE_STATE.UPCOMING:
      return t('announcement');
  }
};

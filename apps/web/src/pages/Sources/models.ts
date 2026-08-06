import { SOURCE_CONTENT_TYPE, SOURCE_STATUS, type SourceStatus } from '@tanuki/contracts';
import { STATUS_DEGRADED_COLOR, STATUS_DOWN_COLOR, STATUS_OK_COLOR } from '@/shared/lib/palette';
import type { SourceContentType } from '../../../../../packages/contracts/dist/cjs';

export const getSourceStatusColor = (status: SourceStatus) => {
  switch (status) {
    case SOURCE_STATUS.ok:
      return STATUS_OK_COLOR;
    case SOURCE_STATUS.degraded:
      return STATUS_DEGRADED_COLOR;
    case SOURCE_STATUS.down:
      return STATUS_DOWN_COLOR;
  }
};

export const getSourceStatusLabel = (status: SourceStatus) => {
  switch (status) {
    case SOURCE_STATUS.ok:
      return 'онлайн';
    case SOURCE_STATUS.degraded:
      return 'нестабилен';
    case SOURCE_STATUS.down:
      return 'недоступен';
  }
};

export const getLabelByContentType = (contentType: SourceContentType) => {
  switch (contentType) {
    case SOURCE_CONTENT_TYPE.manga:
      return 'Манга и манхва';
    case SOURCE_CONTENT_TYPE.hentai:
      return 'Хентай';
    case SOURCE_CONTENT_TYPE.comics:
      return 'Комиксы';
    case SOURCE_CONTENT_TYPE.other:
    default:
      return 'Прочее';
  }
};

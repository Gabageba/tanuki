import type { TFunction } from 'i18next';
import { INVITE_STATUS, type InviteStatus } from '@tanuki/contracts';
import { STATUS_DEGRADED_COLOR, STATUS_DOWN_COLOR, STATUS_OK_COLOR } from '@/shared/lib/palette';

export const getInviteStatusLabel = (status: InviteStatus, t: TFunction) => {
  switch (status) {
    case INVITE_STATUS.ACTIVE:
      return t('active');
    case INVITE_STATUS.USED:
      return t('used');
    case INVITE_STATUS.EXPIRED:
      return t('expired');
    case INVITE_STATUS.REVOKED:
      return t('revoked');
  }
};

export const getInviteStatusColor = (status: InviteStatus) => {
  switch (status) {
    case INVITE_STATUS.ACTIVE:
      return STATUS_OK_COLOR;
    case INVITE_STATUS.USED:
      return 'blue';
    case INVITE_STATUS.EXPIRED:
      return STATUS_DEGRADED_COLOR;
    case INVITE_STATUS.REVOKED:
      return STATUS_DOWN_COLOR;
  }
};

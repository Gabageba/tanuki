import { STATUS_DEGRADED_COLOR, STATUS_OK_COLOR } from '@/shared/lib/palette';
import { ACCOUNT_STATE, type AccountState } from './models';

export const getStateLabel = (state: AccountState) => {
  switch (state) {
    case ACCOUNT_STATE.NONE:
      return 'Не привязан';
    case ACCOUNT_STATE.ACTIVE:
      return 'Вошли';
    case ACCOUNT_STATE.RELOGIN:
      return 'Нужно войти заново';
  }
};

export const getStateColor = (state: AccountState) => {
  switch (state) {
    case ACCOUNT_STATE.NONE:
      return 'gray';
    case ACCOUNT_STATE.ACTIVE:
      return STATUS_OK_COLOR;
    case ACCOUNT_STATE.RELOGIN:
      return STATUS_DEGRADED_COLOR;
  }
};

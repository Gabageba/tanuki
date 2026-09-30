import { PRIMARY_COLOR, STATUS_DEGRADED_COLOR, STATUS_OK_COLOR } from '@/shared/lib/palette';
import { ACCOUNT_STATE, type AccountState } from '../AccountGroups/models';

/** Цвет шапки по состоянию — как `getSourceAccountStatusColor` на экране настроек. */
export const getHeaderColor = (state: AccountState) => {
  switch (state) {
    case ACCOUNT_STATE.NONE:
      return PRIMARY_COLOR;
    case ACCOUNT_STATE.ACTIVE:
      return STATUS_OK_COLOR;
    case ACCOUNT_STATE.RELOGIN:
      return STATUS_DEGRADED_COLOR;
  }
};

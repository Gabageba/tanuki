import { ArrowsClockwiseIcon, SignInIcon } from '@phosphor-icons/react';
import { ACCOUNT_STATE, type AccountState } from '../../SourcesSetup/models';

/** Иконка кнопки входа: первый вход и повторный различаются и ею, не только подписью. */
export const getLoginActionIcon = (state: AccountState) => {
  switch (state) {
    case ACCOUNT_STATE.NONE:
      return <SignInIcon />;
    case ACCOUNT_STATE.ACTIVE:
      return null;
    case ACCOUNT_STATE.RELOGIN:
      return <ArrowsClockwiseIcon />;
  }
};

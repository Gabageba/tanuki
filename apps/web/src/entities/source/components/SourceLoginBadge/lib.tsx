import { KeyIcon, SignInIcon, WarningCircleIcon } from '@phosphor-icons/react';
import { SOURCE_LOGIN_MARK, type SourceLoginMark } from '../../models';

export const getSourceLoginMarkIcon = (mark: SourceLoginMark, size: number) => {
  switch (mark) {
    case SOURCE_LOGIN_MARK.REQUIRED:
      return <KeyIcon size={size} />;
    case SOURCE_LOGIN_MARK.OPTIONAL:
      return <SignInIcon size={size} />;
    case SOURCE_LOGIN_MARK.RELOGIN:
      return <WarningCircleIcon size={size} />;
  }
};

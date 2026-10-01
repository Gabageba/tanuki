import {
  GiftIcon,
  KeyIcon,
  LockKeyIcon,
  LockKeyOpenIcon,
  SignInIcon,
  UserPlusIcon,
  WarningCircleIcon,
} from '@phosphor-icons/react';
import { ICON_SET, LOGIN_MARK, type IconSet, type LoginMark } from '../models';

const getRequiredIcon = (iconSet: IconSet, size: number) => {
  switch (iconSet) {
    case ICON_SET.KEY_SIGN_IN:
      return <KeyIcon size={size} />;
    case ICON_SET.LOCKS:
    case ICON_SET.LOCK_SIGN_IN:
    case ICON_SET.LOCK_GIFT:
    case ICON_SET.LOCK_USER_PLUS:
      return <LockKeyIcon size={size} />;
  }
};

const getOptionalIcon = (iconSet: IconSet, size: number) => {
  switch (iconSet) {
    case ICON_SET.LOCKS:
      return <LockKeyOpenIcon size={size} />;
    case ICON_SET.LOCK_SIGN_IN:
    case ICON_SET.KEY_SIGN_IN:
      return <SignInIcon size={size} />;
    case ICON_SET.LOCK_GIFT:
      return <GiftIcon size={size} />;
    case ICON_SET.LOCK_USER_PLUS:
      return <UserPlusIcon size={size} />;
  }
};

export const getMarkIcon = (mark: LoginMark, size: number, iconSet: IconSet) => {
  switch (mark) {
    case LOGIN_MARK.REQUIRED:
      return getRequiredIcon(iconSet, size);
    case LOGIN_MARK.OPTIONAL:
      return getOptionalIcon(iconSet, size);
    case LOGIN_MARK.RELOGIN:
      return <WarningCircleIcon size={size} />;
  }
};

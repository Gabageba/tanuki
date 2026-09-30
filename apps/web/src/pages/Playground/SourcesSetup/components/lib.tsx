import {
  BookmarksSimpleIcon,
  CheckCircleIcon,
  EyeSlashIcon,
  LockKeyIcon,
  LockKeyOpenIcon,
  SignInIcon,
  UserCircleIcon,
  WarningCircleIcon,
} from '@phosphor-icons/react';
import { Text } from '@mantine/core';
import {
  ACCOUNT_STATE,
  LOGIN_BENEFIT,
  LOGIN_MARK,
  LOGIN_REQUIREMENT,
  type AccountState,
  type LoginBenefit,
  type LoginMark,
  type LoginRequirement,
} from '../models';

export const getAccountStateIcon = (state: AccountState) => {
  switch (state) {
    case ACCOUNT_STATE.NONE:
      return <UserCircleIcon />;
    case ACCOUNT_STATE.ACTIVE:
      return <CheckCircleIcon />;
    case ACCOUNT_STATE.RELOGIN:
      return <WarningCircleIcon />;
  }
};

export const getLoginMarkIcon = (mark: LoginMark) => {
  switch (mark) {
    case LOGIN_MARK.LOGIN_NEEDED:
      return <LockKeyIcon />;
    case LOGIN_MARK.RELOGIN:
      return <WarningCircleIcon />;
    case LOGIN_MARK.OPTIONAL:
      return <SignInIcon />;
  }
};

export const getRequirementIcon = (requirement: LoginRequirement) => {
  switch (requirement) {
    case LOGIN_REQUIREMENT.REQUIRED:
      return <LockKeyIcon />;
    case LOGIN_REQUIREMENT.OPTIONAL:
      return <LockKeyOpenIcon />;
  }
};

export const getBenefitIcon = (benefit: LoginBenefit) => {
  switch (benefit) {
    case LOGIN_BENEFIT.ADULT_TITLES:
      return (
        <Text span ff="monospace" fz={11} lh={1}>
          18+
        </Text>
      );
    case LOGIN_BENEFIT.HIDDEN_TITLES:
      return <EyeSlashIcon />;
    case LOGIN_BENEFIT.BOOKMARKS_IMPORT:
      return <BookmarksSimpleIcon />;
  }
};

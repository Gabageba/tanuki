import type { ReactNode } from 'react';
import type { TFunction } from 'i18next';
import { USER_ROLE, type UserRole } from '@tanuki/contracts';
import { PRIMARY_COLOR } from '@/shared/lib/palette';

export const getUserRoleLabel = (role: UserRole, t: TFunction) => {
  switch (role) {
    case USER_ROLE.ADMIN:
      return t('admin');
    case USER_ROLE.MODERATOR:
      return t('moderator');
    case USER_ROLE.USER:
      return t('user');
  }
};

export const getUserRoleColor = (role: UserRole) => {
  switch (role) {
    case USER_ROLE.ADMIN:
      return PRIMARY_COLOR;
    case USER_ROLE.MODERATOR:
      return 'blue';
    case USER_ROLE.USER:
      return 'gray';
  }
};

/** Ключ составного столбца: подпись после названия у активного столбца («Даты · регистрация»),
 *  пункт меню («По регистрации») и его иконка. */
export type SortKeyOption<Sort extends string> = {
  sort: Sort;
  label: string;
  menuLabel: string;
  icon: ReactNode;
};

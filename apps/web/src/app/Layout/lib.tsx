import type { TFunction } from 'i18next';
import {
  AsclepiusIcon,
  FlaskIcon,
  GearSixIcon,
  UserGearIcon,
  UserIcon,
} from '@phosphor-icons/react';
import { isStaffRole, type UserRole } from '@tanuki/contracts';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import {
  ACCOUNT_MENU_ITEM,
  ACCOUNT_MENU_SECTION,
  ACCOUNT_MENU_SECTIONS,
  type AccountMenuItem,
  type AccountMenuSection,
} from './models';

export const getAccountMenuItemLabel = (item: AccountMenuItem, t: TFunction) => {
  switch (item) {
    case ACCOUNT_MENU_ITEM.PROFILE:
      return t('profile');
    case ACCOUNT_MENU_ITEM.SETTINGS:
      return t('settings');
    case ACCOUNT_MENU_ITEM.SOURCES_HEALTH:
      return t('sourcesHealth');
    case ACCOUNT_MENU_ITEM.MANAGEMENT:
      return t('management');
    case ACCOUNT_MENU_ITEM.PLAYGROUND:
      return t('playground');
  }
};

export const getAccountMenuItemIcon = (item: AccountMenuItem) => {
  switch (item) {
    case ACCOUNT_MENU_ITEM.PROFILE:
      return <UserIcon />;
    case ACCOUNT_MENU_ITEM.SETTINGS:
      return <GearSixIcon />;
    case ACCOUNT_MENU_ITEM.SOURCES_HEALTH:
      return <AsclepiusIcon />;
    case ACCOUNT_MENU_ITEM.MANAGEMENT:
      return <UserGearIcon />;
    case ACCOUNT_MENU_ITEM.PLAYGROUND:
      return <FlaskIcon />;
  }
};

export const getAccountMenuItemPath = (item: AccountMenuItem) => {
  switch (item) {
    case ACCOUNT_MENU_ITEM.PROFILE:
      return ROUTE_PATHS.PROFILE;
    case ACCOUNT_MENU_ITEM.SETTINGS:
      return ROUTE_PATHS.SETTINGS;
    case ACCOUNT_MENU_ITEM.SOURCES_HEALTH:
      return ROUTE_PATHS.SOURCES_HEALTH;
    case ACCOUNT_MENU_ITEM.MANAGEMENT:
      return ROUTE_PATHS.MANAGEMENT;
    case ACCOUNT_MENU_ITEM.PLAYGROUND:
      return ROUTE_PATHS.PLAYGROUND;
  }
};

export const getAccountMenuSectionLabel = (section: AccountMenuSection, t: TFunction) => {
  switch (section) {
    case ACCOUNT_MENU_SECTION.ACCOUNT:
      return t('account');
    case ACCOUNT_MENU_SECTION.SOURCES:
      return t('sources');
    case ACCOUNT_MENU_SECTION.SERVICE:
      return t('service');
  }
};

const isAccountMenuItemVisible = (item: AccountMenuItem, role: UserRole | undefined) => {
  switch (item) {
    case ACCOUNT_MENU_ITEM.MANAGEMENT:
      return isStaffRole(role);
    case ACCOUNT_MENU_ITEM.PLAYGROUND:
      return import.meta.env.DEV;
    case ACCOUNT_MENU_ITEM.PROFILE:
    case ACCOUNT_MENU_ITEM.SETTINGS:
    case ACCOUNT_MENU_ITEM.SOURCES_HEALTH:
      return true;
  }
};

/** Разделы меню с пунктами, которые этот пользователь увидит; пустой раздел выпадает вместе с
 *  подписью. */
export const getAccountMenuSections = (role: UserRole | undefined) =>
  ACCOUNT_MENU_SECTIONS.map(({ section, items }) => ({
    section,
    items: items.filter((item) => isAccountMenuItemVisible(item, role)),
  })).filter(({ items }) => items.length > 0);

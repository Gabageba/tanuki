import {
  AsclepiusIcon,
  FlaskIcon,
  GearSixIcon,
  UserGearIcon,
  UserIcon,
} from '@phosphor-icons/react';
import { isStaffRole } from '@tanuki/contracts';
import {
  DEVICE,
  DRAWER_KIND,
  MENU_ITEM,
  SHEET_HEIGHT,
  SHEET_POSITION,
  type Device,
  type DrawerKind,
  type DrawerPlacement,
  type MenuItem,
  type MenuSection,
  type MockUser,
  type SheetHeight,
  type SheetPosition,
} from './models';
import { D0_PLACEMENTS } from './mocks';

export const getMenuItemLabel = (item: MenuItem) => {
  switch (item) {
    case MENU_ITEM.PROFILE:
      return 'Профиль';
    case MENU_ITEM.SETTINGS:
      return 'Настройки';
    case MENU_ITEM.SOURCES_HEALTH:
      return 'Здоровье источников';
    case MENU_ITEM.MANAGEMENT:
      return 'Управление';
    case MENU_ITEM.PLAYGROUND:
      return 'Песочница';
  }
};

export const getMenuItemIcon = (item: MenuItem, size?: number) => {
  switch (item) {
    case MENU_ITEM.PROFILE:
      return <UserIcon size={size} />;
    case MENU_ITEM.SETTINGS:
      return <GearSixIcon size={size} />;
    case MENU_ITEM.SOURCES_HEALTH:
      return <AsclepiusIcon size={size} />;
    case MENU_ITEM.MANAGEMENT:
      return <UserGearIcon size={size} />;
    case MENU_ITEM.PLAYGROUND:
      return <FlaskIcon size={size} />;
  }
};

const isMenuItemVisible = (item: MenuItem, user: MockUser) => {
  switch (item) {
    case MENU_ITEM.MANAGEMENT:
      return isStaffRole(user.role);
    case MENU_ITEM.PLAYGROUND:
      return user.isDev;
    case MENU_ITEM.PROFILE:
    case MENU_ITEM.SETTINGS:
    case MENU_ITEM.SOURCES_HEALTH:
      return true;
  }
};

/** Пункты, которые этот пользователь увидит; пустые группы выпадают вместе с разделителем. */
export const getVisibleGroups = (groups: MenuItem[][], user: MockUser) =>
  groups
    .map((group) => group.filter((item) => isMenuItemVisible(item, user)))
    .filter((group) => group.length > 0);

export const getVisibleItems = (items: MenuItem[], user: MockUser) =>
  items.filter((item) => isMenuItemVisible(item, user));

export const getVisibleSections = (sections: MenuSection[], user: MockUser) =>
  sections
    .map((section) => ({ ...section, items: getVisibleItems(section.items, user) }))
    .filter((section) => section.items.length > 0);

export const getDrawerKindLabel = (kind: DrawerKind) => {
  switch (kind) {
    case DRAWER_KIND.MENU:
      return 'Меню';
    case DRAWER_KIND.SOURCES:
      return 'Выбор источника';
    case DRAWER_KIND.FILTERS:
      return 'Фильтры каталога';
    case DRAWER_KIND.CHAPTERS:
      return 'Главы в читалке';
    case DRAWER_KIND.READER_SETTINGS:
      return 'Настройки читалки';
    case DRAWER_KIND.USER:
      return 'Пользователь';
    case DRAWER_KIND.SOURCE:
      return 'Источник';
    case DRAWER_KIND.INVITE:
      return 'Приглашение';
  }
};

const getSheetHeightLabel = (height: SheetHeight) => {
  switch (height) {
    case SHEET_HEIGHT.AUTO:
      return 'по содержимому';
    case SHEET_HEIGHT.TALL:
      return 'почти на весь экран';
  }
};

export const getPlacementCaption = (
  position: SheetPosition,
  height: SheetHeight,
  device: Device,
) => {
  const isPhone = device === DEVICE.PHONE;
  switch (position) {
    case SHEET_POSITION.BOTTOM:
      return `Снизу, ${getSheetHeightLabel(height)}`;
    case SHEET_POSITION.LEFT:
      return isPhone ? 'Слева, на весь экран' : 'Слева';
    case SHEET_POSITION.RIGHT:
      return isPhone ? 'Справа, на весь экран' : 'Справа';
  }
};

/** Размер мини-экрана и доля, которую занимает боковой drawer: на телефоне он во всю ширину,
 *  на планшете 440px — больше половины, на десктопе — около трети. */
export const getSilhouetteSize = (device: Device) => {
  switch (device) {
    case DEVICE.PHONE:
      return { w: 36, h: 64, side: '88%' };
    case DEVICE.TABLET:
      return { w: 48, h: 64, side: '57%' };
    case DEVICE.DESKTOP:
      return { w: 96, h: 60, side: '34%' };
  }
};

/** Какие drawer'ы в варианте стоят не так, как сейчас. */
export const getChangedKinds = (placements: DrawerPlacement[]) =>
  placements
    .filter((placement) => {
      const current = D0_PLACEMENTS.find((item) => item.kind === placement.kind);
      return (
        current?.phone !== placement.phone ||
        current.phoneHeight !== placement.phoneHeight ||
        current.tablet !== placement.tablet ||
        current.tabletHeight !== placement.tabletHeight ||
        current.desktop !== placement.desktop
      );
    })
    .map((placement) => placement.kind);

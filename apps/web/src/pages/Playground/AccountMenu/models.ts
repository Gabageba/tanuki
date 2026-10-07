import type { ReactNode } from 'react';
import type { EnumLiteralsOf, UserRole } from '@tanuki/contracts';

export type MockUser = {
  username: string;
  email: string;
  role: UserRole;
  avatarUrl: string | null;
  /** Песочница в меню есть только в DEV-сборке — у мока это флаг, а не import.meta.env. */
  isDev: boolean;
  /** Подпись состояния над макетом. */
  caption: string;
};

export const MENU_ITEM = {
  PROFILE: 'profile',
  SETTINGS: 'settings',
  SOURCES_HEALTH: 'sourcesHealth',
  MANAGEMENT: 'management',
  PLAYGROUND: 'playground',
} as const;
export type MenuItem = EnumLiteralsOf<typeof MENU_ITEM>;

/** Чем открывается меню в нижней панели телефона. */
export const MENU_TRIGGER = {
  MENU: 'menu',
  AVATAR_PROFILE: 'avatarProfile',
  AVATAR_NAME: 'avatarName',
  /** Открыт не меню, а выбор источника — активна первая кнопка панели. */
  SOURCES: 'sources',
} as const;
export type MenuTrigger = EnumLiteralsOf<typeof MENU_TRIGGER>;

/** Как меню выезжает на телефоне. */
export const SHEET_POSITION = {
  BOTTOM: 'bottom',
  RIGHT: 'right',
  LEFT: 'left',
} as const;
export type SheetPosition = EnumLiteralsOf<typeof SHEET_POSITION>;

export type Variant = {
  code: string;
  title: string;
  description: string;
  pros: string[];
  cons: string[];
  /** Ширина выпадающего меню на десктопе; undefined — по содержимому, как у Mantine. */
  menuWidth?: number;
  renderDesktop: (user: MockUser) => ReactNode;
  renderMobile: (user: MockUser) => ReactNode;
};

/** Раздел меню с подписью (M2). */
export type MenuSection = {
  label: string;
  items: MenuItem[];
};

/** Высота sheet снизу: по содержимому или почти на весь экран — для длинных списков. */
export const SHEET_HEIGHT = {
  AUTO: 'auto',
  TALL: 'tall',
} as const;
export type SheetHeight = EnumLiteralsOf<typeof SHEET_HEIGHT>;

/** Ось H: как оформлен заголовок drawer. */
export const HEADER_STYLE = {
  TEXT: 'text',
  ENTITY: 'entity',
  /** H1a: как ENTITY, и приглашение тоже карточкой. */
  ENTITY_WITH_INVITE: 'entityWithInvite',
  UNIFORM: 'uniform',
} as const;
export type HeaderStyle = EnumLiteralsOf<typeof HEADER_STYLE>;

/** Все drawer'ы приложения. */
export const DRAWER_KIND = {
  MENU: 'menu',
  SOURCES: 'sources',
  FILTERS: 'filters',
  CHAPTERS: 'chapters',
  READER_SETTINGS: 'readerSettings',
  USER: 'user',
  SOURCE: 'source',
  INVITE: 'invite',
} as const;
export type DrawerKind = EnumLiteralsOf<typeof DRAWER_KIND>;

export type DrawerPlacement = {
  kind: DrawerKind;
  phone: SheetPosition;
  /** Только для BOTTOM. */
  phoneHeight?: SheetHeight;
  /** null — на планшете этого drawer нет: фильтры каталога там карточкой на странице. */
  tablet: SheetPosition | null;
  /** Только для BOTTOM. */
  tabletHeight?: SheetHeight;
  /** null — на десктопе этого drawer нет (меню, выбор источника, фильтры каталога). */
  desktop: SheetPosition | null;
};

export type LayoutVariant = {
  code: string;
  title: string;
  description: string;
  pros: string[];
  cons: string[];
  placements: DrawerPlacement[];
};

/** Ширина экрана в схеме сторон: телефон < 768, планшет 768–991 (нижняя панель ещё есть),
 *  десктоп ≥ 992. */
export const DEVICE = {
  PHONE: 'phone',
  TABLET: 'tablet',
  DESKTOP: 'desktop',
} as const;
export type Device = EnumLiteralsOf<typeof DEVICE>;

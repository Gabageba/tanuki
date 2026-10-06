import { USER_ROLE } from '@tanuki/contracts';
import {
  DRAWER_KIND,
  MENU_ITEM,
  SHEET_HEIGHT,
  SHEET_POSITION,
  type DrawerPlacement,
  type MenuItem,
  type MenuSection,
  type MockUser,
} from './models';

export const ADMIN: MockUser = {
  username: 'gabageba',
  email: 'gabageba@gmail.com',
  role: USER_ROLE.ADMIN,
  avatarUrl: 'https://i.pravatar.cc/120?img=12',
  isDev: true,
  caption: 'Админ · фото · DEV-сборка',
};

export const LONG_USER: MockUser = {
  username: 'konstantin.verkhovtsev_9',
  email: 'konstantin.verkhovtsev.reading@yandex.ru',
  role: USER_ROLE.USER,
  avatarUrl: null,
  isDev: false,
  caption: 'Пользователь · инициалы · длинные имя и почта',
};

export const USERS = [ADMIN, LONG_USER];

/** M1, M3, M4 на десктопе после карточки: личное · служебное. */
export const PERSONAL_GROUP: MenuItem[] = [MENU_ITEM.SETTINGS, MENU_ITEM.SOURCES_HEALTH];
export const STAFF_GROUP: MenuItem[] = [MENU_ITEM.MANAGEMENT, MENU_ITEM.PLAYGROUND];

/** M2: разделы с подписями. */
export const M2_SECTIONS: MenuSection[] = [
  { label: 'Аккаунт', items: [MENU_ITEM.PROFILE, MENU_ITEM.SETTINGS] },
  { label: 'Источники', items: [MENU_ITEM.SOURCES_HEALTH] },
  { label: 'Служебное', items: [MENU_ITEM.MANAGEMENT, MENU_ITEM.PLAYGROUND] },
];

const CARD_PLACEMENTS: DrawerPlacement[] = [
  DRAWER_KIND.USER,
  DRAWER_KIND.SOURCE,
  DRAWER_KIND.INVITE,
].map((kind) => ({
  kind,
  phone: SHEET_POSITION.BOTTOM,
  tablet: SHEET_POSITION.RIGHT,
  desktop: SHEET_POSITION.RIGHT,
}));

export const D0_PLACEMENTS: DrawerPlacement[] = [
  {
    kind: DRAWER_KIND.MENU,
    phone: SHEET_POSITION.RIGHT,
    tablet: SHEET_POSITION.RIGHT,
    desktop: null,
  },
  {
    kind: DRAWER_KIND.SOURCES,
    phone: SHEET_POSITION.LEFT,
    tablet: SHEET_POSITION.LEFT,
    desktop: null,
  },
  {
    kind: DRAWER_KIND.FILTERS,
    phone: SHEET_POSITION.BOTTOM,
    phoneHeight: SHEET_HEIGHT.TALL,
    tablet: null,
    desktop: null,
  },
  {
    kind: DRAWER_KIND.CHAPTERS,
    phone: SHEET_POSITION.LEFT,
    tablet: SHEET_POSITION.LEFT,
    desktop: SHEET_POSITION.LEFT,
  },
  {
    kind: DRAWER_KIND.READER_SETTINGS,
    phone: SHEET_POSITION.RIGHT,
    tablet: SHEET_POSITION.RIGHT,
    desktop: SHEET_POSITION.RIGHT,
  },
  ...CARD_PLACEMENTS,
];

export const D1_PLACEMENTS: DrawerPlacement[] = [
  {
    kind: DRAWER_KIND.MENU,
    phone: SHEET_POSITION.BOTTOM,
    tablet: SHEET_POSITION.RIGHT,
    desktop: null,
  },
  {
    kind: DRAWER_KIND.SOURCES,
    phone: SHEET_POSITION.BOTTOM,
    phoneHeight: SHEET_HEIGHT.TALL,
    tablet: SHEET_POSITION.LEFT,
    desktop: null,
  },
  {
    kind: DRAWER_KIND.FILTERS,
    phone: SHEET_POSITION.BOTTOM,
    phoneHeight: SHEET_HEIGHT.TALL,
    tablet: null,
    desktop: null,
  },
  {
    kind: DRAWER_KIND.CHAPTERS,
    phone: SHEET_POSITION.BOTTOM,
    phoneHeight: SHEET_HEIGHT.TALL,
    tablet: SHEET_POSITION.LEFT,
    desktop: SHEET_POSITION.LEFT,
  },
  {
    kind: DRAWER_KIND.READER_SETTINGS,
    phone: SHEET_POSITION.BOTTOM,
    phoneHeight: SHEET_HEIGHT.TALL,
    tablet: SHEET_POSITION.RIGHT,
    desktop: SHEET_POSITION.RIGHT,
  },
  ...CARD_PLACEMENTS,
];

export const D2_PLACEMENTS: DrawerPlacement[] = [
  {
    kind: DRAWER_KIND.MENU,
    phone: SHEET_POSITION.BOTTOM,
    tablet: SHEET_POSITION.RIGHT,
    desktop: null,
  },
  {
    kind: DRAWER_KIND.SOURCES,
    phone: SHEET_POSITION.LEFT,
    tablet: SHEET_POSITION.LEFT,
    desktop: null,
  },
  {
    kind: DRAWER_KIND.FILTERS,
    phone: SHEET_POSITION.BOTTOM,
    phoneHeight: SHEET_HEIGHT.TALL,
    tablet: null,
    desktop: null,
  },
  {
    kind: DRAWER_KIND.CHAPTERS,
    phone: SHEET_POSITION.LEFT,
    tablet: SHEET_POSITION.LEFT,
    desktop: SHEET_POSITION.LEFT,
  },
  {
    kind: DRAWER_KIND.READER_SETTINGS,
    phone: SHEET_POSITION.BOTTOM,
    phoneHeight: SHEET_HEIGHT.TALL,
    tablet: SHEET_POSITION.RIGHT,
    desktop: SHEET_POSITION.RIGHT,
  },
  ...CARD_PLACEMENTS,
];

export const D3_PLACEMENTS: DrawerPlacement[] = D1_PLACEMENTS.map((placement) => ({
  ...placement,
  tablet: placement.tablet && SHEET_POSITION.RIGHT,
  desktop: placement.desktop && SHEET_POSITION.RIGHT,
}));

/** D4: как D1, но на планшете открытое из нижней панели выезжает снизу, как на телефоне. */
export const D4_PLACEMENTS: DrawerPlacement[] = D1_PLACEMENTS.map((placement) =>
  placement.kind === DRAWER_KIND.MENU || placement.kind === DRAWER_KIND.SOURCES
    ? { ...placement, tablet: SHEET_POSITION.BOTTOM, tabletHeight: placement.phoneHeight }
    : placement,
);

import { createContext } from 'react';
import type { EnumLiteralsOf } from '@tanuki/contracts';
import type { SectionNavGroup } from '../components/SectionNav';

/** Типы и категории из плана docs/plans/notifications.md — в `@tanuki/contracts` они появятся при
 *  реализации, поэтому макет держит свою копию. */
export const MOCK_CATEGORY = {
  CHAPTERS: 'chapters',
  ACCOUNT: 'account',
  SOURCES: 'sources',
  ADMINISTRATION: 'administration',
} as const;
export type MockCategory = EnumLiteralsOf<typeof MOCK_CATEGORY>;

export const MOCK_TYPE = {
  NEW_CHAPTERS: 'newChapters',
  EMAIL_CHANGED: 'emailChanged',
  DELETION_REQUESTED: 'deletionRequested',
  NEW_DEVICE_LOGIN: 'newDeviceLogin',
  SOURCE_DOWN: 'sourceDown',
  SOURCE_RECOVERED: 'sourceRecovered',
  PARSER_DOWN: 'parserDown',
  PARSER_RECOVERED: 'parserRecovered',
  INVITE_USED: 'inviteUsed',
  INVITE_EXPIRED: 'inviteExpired',
} as const;
export type MockType = EnumLiteralsOf<typeof MOCK_TYPE>;

/** Тон уведомления: безопасность — красный, источник лёг — золотой, ожил — зелёный. */
export const MOCK_TONE = {
  ACCENT: 'accent',
  DANGER: 'danger',
  WARNING: 'warning',
  SUCCESS: 'success',
  NEUTRAL: 'neutral',
} as const;
export type MockTone = EnumLiteralsOf<typeof MOCK_TONE>;

export type MockNotification = {
  id: string;
  type: MockType;
  /** Название тайтла, источника или ник — то, что подставляется в текст. */
  subject: string | null;
  /** Новых глав в группе закладки — только у `newChapters`. */
  count: number | null;
  /** Подпись устройства, причина и тому подобное. */
  detail: string | null;
  coverSeed: string | null;
  ago: string;
};

export const LEADING = {
  COVER_AND_ICON: 'coverAndIcon',
  ICON: 'icon',
} as const;
export type Leading = EnumLiteralsOf<typeof LEADING>;

export const COUNTER = {
  WORDS: 'words',
  PILL: 'pill',
} as const;
export type Counter = EnumLiteralsOf<typeof COUNTER>;

export const ROWS = {
  LEGACY: 'legacy',
  FULL_DIVIDER: 'fullDivider',
  CARDS: 'cards',
  FRAME: 'frame',
  INSET_DIVIDER: 'insetDivider',
  PLAIN: 'plain',
} as const;
export type Rows = EnumLiteralsOf<typeof ROWS>;

/** Вид подсветки строки в вариациях `NotificationRowWhole`. */
export const ROW_APPEARANCE = {
  SQUARE: 'square',
  ROUNDED: 'rounded',
  CARD: 'card',
} as const;
export type RowAppearance = EnumLiteralsOf<typeof ROW_APPEARANCE>;

export const BADGE = {
  NONE: 'none',
  COUNT: 'count',
  DOT: 'dot',
  HYBRID: 'hybrid',
} as const;
export type Badge = EnumLiteralsOf<typeof BADGE>;

export const FILTER = {
  SELECT: 'select',
  CHIPS: 'chips',
  SEGMENTS: 'segments',
} as const;
export type Filter = EnumLiteralsOf<typeof FILTER>;

export const PAGINATION = {
  PAGES: 'pages',
  LOAD_MORE: 'loadMore',
  INFINITE: 'infinite',
} as const;
export type Pagination = EnumLiteralsOf<typeof PAGINATION>;

export const EMPTY = {
  PLAIN: 'plain',
  DESCRIBED: 'described',
  BY_REASON: 'byReason',
  BY_REASON_NO_LINK: 'byReasonNoLink',
} as const;
export type Empty = EnumLiteralsOf<typeof EMPTY>;

export const EMPTY_REASON = {
  FEED: 'feed',
  FILTER: 'filter',
} as const;
export type EmptyReason = EnumLiteralsOf<typeof EMPTY_REASON>;

export const TOAST_ACTION = {
  WHOLE: 'whole',
  LINK: 'link',
  NONE: 'none',
} as const;
export type ToastAction = EnumLiteralsOf<typeof TOAST_ACTION>;

export const TOAST_TONE = {
  BY_CATEGORY: 'byCategory',
  NEUTRAL: 'neutral',
} as const;
export type ToastTone = EnumLiteralsOf<typeof TOAST_TONE>;

export const PUSH_OFFER_STATE = {
  ASK: 'ask',
  DENIED: 'denied',
} as const;
export type PushOfferState = EnumLiteralsOf<typeof PUSH_OFFER_STATE>;

export const SETTINGS_LAYOUT = {
  ROWS: 'rows',
  CARDS: 'cards',
  TABLE: 'table',
} as const;
export type SettingsLayout = EnumLiteralsOf<typeof SETTINGS_LAYOUT>;

export const DEVICE_STATE = {
  UNSUPPORTED: 'unsupported',
  IOS_NOT_INSTALLED: 'iosNotInstalled',
  DENIED: 'denied',
  OFF: 'off',
  ON: 'on',
  EXPIRED: 'expired',
} as const;
export type DeviceState = EnumLiteralsOf<typeof DEVICE_STATE>;

export const MOCK_ROLE = {
  USER: 'user',
  MODERATOR: 'moderator',
  ADMIN: 'admin',
} as const;
export type MockRole = EnumLiteralsOf<typeof MOCK_ROLE>;

/** Ось M: как выглядит предложение включить push. */
export const PUSH_LAYOUT = {
  CURRENT: 'current',
  COMPACT: 'compact',
  INLINE: 'inline',
  CARD: 'card',
} as const;
export type PushLayout = EnumLiteralsOf<typeof PUSH_LAYOUT>;

/** Ось X: значки «убрать одно» и «убрать все». */
export const DISMISS = {
  CURRENT: 'current',
  CHECK: 'check',
  CROSS: 'cross',
  TRASH: 'trash',
} as const;
export type Dismiss = EnumLiteralsOf<typeof DISMISS>;

export const PAGE_SIZE = 20;

/** Q1: сколько тостов держим на экране, самые старые закрываются. */
export const MAX_TOASTS = 3;

/** Внутри рамки телефона брейкпоинты Mantine смотрят на окно, а не на рамку, поэтому мобильную
 *  раскладку компоненты выбирают по этому контексту. */
export const PHONE_FRAME_CONTEXT = createContext(false);

/** Разделы страницы для боковой навигации — в порядке, как на странице. */
export const SECTION_GROUPS: SectionNavGroup[] = [
  { title: 'Итог', axes: [{ letter: '★', title: 'Выбранная комбинация' }] },
  {
    title: 'Строки ленты',
    axes: [
      { letter: 'R', title: 'Разделение строк' },
      { letter: 'L', title: 'Слева в строке' },
      { letter: 'N', title: 'Число новых глав' },
    ],
  },
  { title: 'Колокольчик', axes: [{ letter: 'B', title: 'Бейдж' }] },
  {
    title: 'Список',
    axes: [
      { letter: 'F', title: 'Фильтр категорий' },
      { letter: 'P', title: 'Страницы' },
      { letter: 'E', title: 'Пустая лента' },
      { letter: 'X', title: 'Значки «прочитано»' },
    ],
  },
  {
    title: 'Тосты',
    axes: [
      { letter: 'T', title: 'Кликабельность' },
      { letter: 'D', title: 'Тон и длительность' },
      { letter: 'Q', title: 'Несколько подряд' },
    ],
  },
  {
    title: 'Push и настройки',
    axes: [
      { letter: 'K', title: 'Предложение push' },
      { letter: 'M', title: 'Предложение push на телефоне' },
      { letter: 'S', title: 'Вкладка настроек' },
    ],
  },
];

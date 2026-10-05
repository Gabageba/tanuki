import { createContext } from 'react';
import {
  INVITE_STATUS,
  USER_ROLE,
  type EnumLiteralsOf,
  type InvitableRole,
  type InviteStatus,
  type SortDirection,
  type UserRole,
} from '@tanuki/contracts';

/** «Сейчас» для моков: сроки считаются от него, а не от часов, так страница-артефакт не стареет. */
export const NOW = '2026-10-02T12:00:00Z';

/** Сколько живёт приглашение — как `INVITE_TTL_MS` в API. */
export const INVITE_TTL_DAYS = 7;

/** Сколько строк на странице таблицы — как у пользователей. */
export const PAGE_SIZE = 10;

/** Сколько ждёт двухшаговая кнопка отзыва (R2), прежде чем вернуться в исходный вид. */
export const REVOKE_CONFIRM_TIMEOUT_MS = 3000;

/** Порядок статусов при сортировке «по статусу»: активные — наверху. */
export const STATUS_ORDER: InviteStatus[] = [
  INVITE_STATUS.ACTIVE,
  INVITE_STATUS.USED,
  INVITE_STATUS.EXPIRED,
  INVITE_STATUS.REVOKED,
];

/** Кем смотрим: от этого зависит, что можно отозвать и какую роль выдать. */
export const VIEWER = {
  ADMIN: USER_ROLE.ADMIN,
  MODERATOR: USER_ROLE.MODERATOR,
} as const;
export type Viewer = EnumLiteralsOf<typeof VIEWER>;

/** Состояние данных во всех вариантах разом. */
export const DATA_STATE = {
  READY: 'ready',
  LOADING: 'loading',
  EMPTY: 'empty',
  NOTHING_FOUND: 'nothingFound',
} as const;
export type DataState = EnumLiteralsOf<typeof DATA_STATE>;

/** T — какие поля в каких столбцах. */
export const TABLE_LAYOUT = {
  CURRENT: 'current',
  SEPARATE: 'separate',
  MERGED: 'merged',
  OUTCOME: 'outcome',
} as const;
export type TableLayout = EnumLiteralsOf<typeof TABLE_LAYOUT>;

/** D — карточка приглашения. */
export const DRAWER_LAYOUT = {
  FIELDS: 'fields',
  TIMELINE: 'timeline',
} as const;
export type DrawerLayout = EnumLiteralsOf<typeof DRAWER_LAYOUT>;

/** R — подтверждение отзыва. */
export const REVOKE_CONFIRM = {
  MODAL: 'modal',
  TWO_STEP: 'twoStep',
} as const;
export type RevokeConfirm = EnumLiteralsOf<typeof REVOKE_CONFIRM>;

/** L — что делать, если ссылку потеряли. */
export const LINK_RECOVERY = {
  REISSUE: 'reissue',
  STORED: 'stored',
} as const;
export type LinkRecovery = EnumLiteralsOf<typeof LINK_RECOVERY>;

/** N — как назван столбец «Итог» в T3; IN_STATUS — столбца нет, итог под бейджем статуса. */
export const OUTCOME_COLUMN = {
  SUMMARY: 'summary',
  RESULT: 'result',
  ISSUE: 'issue',
  DETAILS: 'details',
  IN_STATUS: 'inStatus',
} as const;
export type OutcomeColumn = EnumLiteralsOf<typeof OUTCOME_COLUMN>;

/** M — как подан текст в модалке. CURRENT — как у каждой модалки сейчас. */
export const MESSAGE_PATTERN = {
  CURRENT: 'current',
  ICON_ASIDE: 'iconAside',
  PLAIN: 'plain',
  CENTERED: 'centered',
  ALERT: 'alert',
  STRIPE: 'stripe',
  DETAILS_STRIPE: 'detailsStripe',
  BLOCKQUOTE: 'blockquote',
  TINTED: 'tinted',
  INLINE_ICON: 'inlineIcon',
  TITLE_ICON: 'titleIcon',
  TOP_STRIPE: 'topStripe',
} as const;
export type MessagePattern = EnumLiteralsOf<typeof MESSAGE_PATTERN>;

/** Тон модалки — от него цвет иконки (M1, M3) и плашки (M4). */
export const MESSAGE_TONE = {
  DANGER: 'danger',
  WARNING: 'warning',
  NEUTRAL: 'neutral',
  SUCCESS: 'success',
} as const;
export type MessageTone = EnumLiteralsOf<typeof MESSAGE_TONE>;

/** M9a–M9c — каким цветом нейтральный тон. ACCENT — как в M1–M10. */
export const NEUTRAL_COLOR = {
  GRAY: 'gray',
  BLUE: 'blue',
  ACCENT: 'accent',
} as const;
export type NeutralColor = EnumLiteralsOf<typeof NEUTRAL_COLOR>;

/** Цвет нейтрального тона для PatternModal ниже по дереву (M9a–M9c); вне провайдера — акцентный. */
export const NEUTRAL_COLOR_CONTEXT = createContext<NeutralColor>(NEUTRAL_COLOR.ACCENT);

/** Все модалки приложения и задачи — для карты тонов и иконок в M9. */
export const APP_MODAL = {
  DELETE_OWN_ACCOUNT: 'deleteOwnAccount',
  DELETE_USER: 'deleteUser',
  BLOCK: 'block',
  REVOKE_INVITE: 'revokeInvite',
  CLEAR_CACHE: 'clearCache',
  RESET_FILTERS: 'resetFilters',
  AGE: 'age',
  NEW_INVITE: 'newInvite',
  CHANGE_PASSWORD: 'changePassword',
  CHANGE_EMAIL: 'changeEmail',
  EXPORT_BOOKMARKS: 'exportBookmarks',
  IMPORT_BOOKMARKS: 'importBookmarks',
  IMPORT_FROM_SOURCE: 'importFromSource',
  NEW_AVATAR: 'newAvatar',
  ADD_TITLE_MANUALLY: 'addTitleManually',
  SOURCE_LOGIN: 'sourceLogin',
  INVITE_CREATED: 'inviteCreated',
} as const;
export type AppModal = EnumLiteralsOf<typeof APP_MODAL>;

/** Какую модалку открыть на оси M. */
export const DEMO_MODAL = {
  REVOKE: 'revoke',
  BLOCK: 'block',
  DELETE_USER: 'deleteUser',
  CLEAR_CACHE: 'clearCache',
  AGE: 'age',
  RESET_FILTERS: 'resetFilters',
} as const;
export type DemoModal = EnumLiteralsOf<typeof DEMO_MODAL>;

/** По чему сортируется таблица. */
export const INVITE_SORT = {
  STATUS: 'status',
  ROLE: 'role',
  CREATED_BY: 'createdBy',
  USED_BY: 'usedBy',
  CREATED_AT: 'createdAt',
  EXPIRES_AT: 'expiresAt',
} as const;
export type InviteSort = EnumLiteralsOf<typeof INVITE_SORT>;

export type MockInvite = {
  id: string;
  role: UserRole;
  status: InviteStatus;
  /** null — выпущено CLI-скриптом до первого пользователя. */
  createdBy: string | null;
  usedBy: string | null;
  /** Кто отозвал — в контракте этого поля пока нет. */
  revokedBy: string | null;
  createdAt: string;
  expiresAt: string;
  usedAt: string | null;
  /** Когда отозвано — в контракте этого поля пока нет. */
  revokedAt: string | null;
  /** Открытый код — в L2 хранится и показывается в карточке, в остальных вариантах только при создании. */
  code: string;
};

export type PanelConfig = {
  table: TableLayout;
  drawer: DrawerLayout;
  revoke: RevokeConfirm;
  link: LinkRecovery;
  outcome: OutcomeColumn;
  message: MessagePattern;
};

export type InviteActions = {
  onRevoke: (id: string) => void;
  /** Отзывает старое и создаёт новое с той же ролью — L1. */
  onReissue: (id: string) => MockInvite;
  onCreate: (role: InvitableRole) => MockInvite;
};

export type SortState = {
  sort: InviteSort;
  direction: SortDirection;
};

export type Variant<Value> = {
  code: string;
  title: string;
  description: string;
  pros: string[];
  cons: string[];
  value: Value;
};

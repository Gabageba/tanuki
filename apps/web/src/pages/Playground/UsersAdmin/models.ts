import type { EnumLiteralsOf, UserRole } from '@tanuki/contracts';
import { USER_ROLE } from '@tanuki/contracts';

/** Ширина десктопной рамки — примерно столько таблице оставляет PageLayout на ноутбуке. */
export const DESKTOP_WIDTH = 1080;

/** Сколько строк на странице таблицы. */
export const PAGE_SIZE = 10;

/** Кем смотрим на таблицу: от этого зависит, какие действия видны. */
export const STAFF_ROLE = {
  ADMIN: USER_ROLE.ADMIN,
  MODERATOR: USER_ROLE.MODERATOR,
} as const;
export type StaffRole = EnumLiteralsOf<typeof STAFF_ROLE>;

/** Состояние аккаунта. Удаление ждёт — это то, что человек запросил сам (deletionScheduledAt). */
export const USER_STATUS = {
  ACTIVE: 'active',
  UNVERIFIED: 'unverified',
  BLOCKED: 'blocked',
  DELETION_SCHEDULED: 'deletionScheduled',
} as const;
export type UserStatus = EnumLiteralsOf<typeof USER_STATUS>;

/** Значение фильтра «без ограничения». */
export const FILTER_ALL = 'all';
export type RoleFilter = UserRole | typeof FILTER_ALL;
export type StatusFilter = UserStatus | typeof FILTER_ALL;

export type MockUser = {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  /** Блокировка до — `YYYY-MM-DDTHH:MM:SSZ`; null у бессрочной и у незаблокированных. */
  blockedUntil: string | null;
  blockReason: string | null;
  /** Когда удалится аккаунт, если человек сам запросил удаление. */
  deletionScheduledAt: string | null;
  /** null — приглашение выпущено CLI-скриптом. */
  invitedBy: string | null;
  createdAt: string;
  /** null — ни разу не входил. */
  lastSeenAt: string | null;
};

export type BlockPayload = {
  until: string | null;
  reason: string | null;
};

export type UserActions = {
  onRoleChange: (id: string, role: UserRole) => void;
  onBlock: (id: string, payload: BlockPayload) => void;
  onUnblock: (id: string) => void;
  onDelete: (id: string) => void;
};

export type Permissions = {
  canChangeRole: boolean;
  canBlock: boolean;
  canDelete: boolean;
};

/** Где живёт экран (ось P). */
export const PLACEMENT = {
  SETTINGS_TAB: 'settingsTab',
  PAGE: 'page',
  STAFF_PAGE: 'staffPage',
} as const;
export type Placement = EnumLiteralsOf<typeof PLACEMENT>;

/** Как разложены столбцы (ось T). */
export const TABLE_LAYOUT = {
  SEPARATE: 'separate',
  MERGED: 'merged',
  COMPACT: 'compact',
  /** T3: T1, но роль — бейджем у имени, а даты — одной ячейкой, как в T2. */
  ROLE_IN_USER: 'roleInUser',
} as const;
export type TableLayout = EnumLiteralsOf<typeof TABLE_LAYOUT>;

/** Как подать действия (ось A). */
export const ACTIONS_MODE = {
  MENU: 'menu',
  ROLE_SELECT: 'roleSelect',
  DRAWER: 'drawer',
} as const;
export type ActionsMode = EnumLiteralsOf<typeof ACTIONS_MODE>;

/** Как выбрать срок блокировки (ось B). */
export const BLOCK_FORM = {
  SEGMENTED: 'segmented',
  SELECT: 'select',
} as const;
export type BlockForm = EnumLiteralsOf<typeof BLOCK_FORM>;

/** Как подтвердить удаление (ось D). */
export const DELETE_CONFIRM = {
  TYPE_USERNAME: 'typeUsername',
  SIMPLE: 'simple',
  /** D3: карточка из D2 и ввод имени из D1. */
  CARD_AND_USERNAME: 'cardAndUsername',
} as const;
export type DeleteConfirm = EnumLiteralsOf<typeof DELETE_CONFIRM>;

/** Поиск и фильтры над таблицей (ось F). */
export const FILTERS_LAYOUT = {
  SELECTS: 'selects',
  SEGMENTED: 'segmented',
} as const;
export type FiltersLayout = EnumLiteralsOf<typeof FILTERS_LAYOUT>;

/** Вид на телефоне (ось M). */
export const MOBILE_LAYOUT = {
  SCROLL: 'scroll',
  CARDS: 'cards',
} as const;
export type MobileLayout = EnumLiteralsOf<typeof MOBILE_LAYOUT>;

/** Срок блокировки. */
export const BLOCK_DURATION = {
  DAY: 'day',
  WEEK: 'week',
  MONTH: 'month',
  FOREVER: 'forever',
  CUSTOM: 'custom',
} as const;
export type BlockDuration = EnumLiteralsOf<typeof BLOCK_DURATION>;

/** B1: сначала «навсегда или на срок», срок — потом. */
export const BLOCK_KIND = {
  FOREVER: 'forever',
  TEMPORARY: 'temporary',
} as const;
export type BlockKind = EnumLiteralsOf<typeof BLOCK_KIND>;

export type PanelConfig = {
  table: TableLayout;
  actions: ActionsMode;
  filters: FiltersLayout;
  block: BlockForm;
  confirm: DeleteConfirm;
  mobile: MobileLayout;
};

export type Variant<Value> = {
  code: string;
  title: string;
  description: string;
  value: Value;
};

/** Что строка таблицы или карточка умеет сделать с пользователем. */
export type RowHandlers = {
  /** A3: клик по строке открывает drawer. */
  onOpen: (user: MockUser) => void;
  onRoleChange: (user: MockUser, role: UserRole) => void;
  onBlock: (user: MockUser) => void;
  onUnblock: (user: MockUser) => void;
  onDelete: (user: MockUser) => void;
};

/** Ширина рамки «телефон». */
export const MOBILE_FRAME_WIDTH = 375;

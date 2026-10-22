import type { TFunction } from 'i18next';
import {
  MANAGED_USERS_SORT,
  SORT_DIRECTION,
  USER_STATUS,
  type EnumLiteralsOf,
  type InvitableRole,
  type ManagedUser,
  type ManagedUsersQuery,
  type ManagedUsersSort,
  type UserStatus,
} from '@tanuki/contracts';
import { STATUS_DEGRADED_COLOR, STATUS_DOWN_COLOR, STATUS_OK_COLOR } from '@/shared/lib/palette';

/** Ширины столбцов: таблица раскладывается по ним, а не по содержимому, — иначе при сортировке
 *  и смене страницы столбцы скачут вслед за новыми строками и подписью ключа в шапке. */
export const USERS_COLUMN_WIDTH = {
  USER: '32%',
  STATUS: '24%',
  INVITED_BY: '16%',
  DATES: '28%',
} as const;

/** С чего начинается таблица: первая страница без фильтров, новые сверху. */
export const DEFAULT_USERS_QUERY = {
  page: 1,
  role: [],
  status: [],
  sort: MANAGED_USERS_SORT.CREATED_AT,
  direction: SORT_DIRECTION.DESC,
} satisfies ManagedUsersQuery;

/** Сколько ждать, пока в поиске перестанут печатать, прежде чем спросить сервер. */
export const SEARCH_DEBOUNCE_MS = 300;

/** С какого направления начинается сортировка по ключу: даты — сначала новые, срок — ближайший
 *  сверху, прочее — по алфавиту. */
export const getDefaultSortDirection = (sort: ManagedUsersSort) => {
  switch (sort) {
    case MANAGED_USERS_SORT.CREATED_AT:
    case MANAGED_USERS_SORT.LAST_SEEN_AT:
      return SORT_DIRECTION.DESC;
    case MANAGED_USERS_SORT.USERNAME:
    case MANAGED_USERS_SORT.EMAIL:
    case MANAGED_USERS_SORT.STATUS:
    case MANAGED_USERS_SORT.STATUS_UNTIL:
    case MANAGED_USERS_SORT.INVITED_BY:
      return SORT_DIRECTION.ASC;
  }
};

/** Что умеет сделать с пользователем строка таблицы и его карточка. */
export type UserHandlers = {
  onOpen: (user: ManagedUser) => void;
  onRoleChange: (user: ManagedUser, role: InvitableRole) => void;
  onBlock: (user: ManagedUser) => void;
  onUnblock: (user: ManagedUser) => void;
  onDelete: (user: ManagedUser) => void;
};

export const getUserStatusLabel = (status: UserStatus, t: TFunction) => {
  switch (status) {
    case USER_STATUS.ACTIVE:
      return t('active');
    case USER_STATUS.UNVERIFIED:
      return t('emailNotVerified');
    case USER_STATUS.BLOCKED:
      return t('blocked');
    case USER_STATUS.DELETION_SCHEDULED:
      return t('beingDeleted');
  }
};

/** Подпись статуса в фильтре — во множественном числе, где оно есть. */
export const getUserStatusFilterLabel = (status: UserStatus, t: TFunction) => {
  switch (status) {
    case USER_STATUS.ACTIVE:
      return t('activePlural');
    case USER_STATUS.UNVERIFIED:
      return t('emailNotVerified');
    case USER_STATUS.BLOCKED:
      return t('blockedPlural');
    case USER_STATUS.DELETION_SCHEDULED:
      return t('beingDeletedPlural');
  }
};

export const getUserStatusColor = (status: UserStatus) => {
  switch (status) {
    case USER_STATUS.ACTIVE:
      return STATUS_OK_COLOR;
    case USER_STATUS.UNVERIFIED:
      return STATUS_DEGRADED_COLOR;
    case USER_STATUS.BLOCKED:
      return STATUS_DOWN_COLOR;
    case USER_STATUS.DELETION_SCHEDULED:
      return 'gray';
  }
};

/** Срок блокировки в списке «Срок». */
export const BLOCK_DURATION = {
  DAY: 'day',
  WEEK: 'week',
  MONTH: 'month',
  FOREVER: 'forever',
  CUSTOM: 'custom',
} as const;
export type BlockDuration = EnumLiteralsOf<typeof BLOCK_DURATION>;

const DAY_MS = 24 * 60 * 60 * 1000;

/** Сколько дней в сроке; null — срок не числом дней. */
const getBlockDurationDays = (duration: BlockDuration) => {
  switch (duration) {
    case BLOCK_DURATION.DAY:
      return 1;
    case BLOCK_DURATION.WEEK:
      return 7;
    case BLOCK_DURATION.MONTH:
      return 30;
    case BLOCK_DURATION.FOREVER:
    case BLOCK_DURATION.CUSTOM:
      return null;
  }
};

export const getBlockDurationLabel = (duration: BlockDuration, t: TFunction) => {
  switch (duration) {
    case BLOCK_DURATION.DAY:
    case BLOCK_DURATION.WEEK:
    case BLOCK_DURATION.MONTH:
      return t('countDays', { count: getBlockDurationDays(duration) ?? 0 });
    case BLOCK_DURATION.FOREVER:
      return t('forever');
    case BLOCK_DURATION.CUSTOM:
      return t('customDate');
  }
};

const toServerDateTime = (date: Date) => `${date.toISOString().slice(0, 19)}Z`;

/** Срок → `until` в серверном формате; null — навсегда. `customDate` — `YYYY-MM-DD` из поля даты. */
export const getBlockedUntil = (duration: BlockDuration, customDate: string) => {
  if (duration === BLOCK_DURATION.CUSTOM) {
    return customDate ? `${customDate}T00:00:00Z` : null;
  }
  const days = getBlockDurationDays(duration);
  return days === null ? null : toServerDateTime(new Date(Date.now() + days * DAY_MS));
};

/** Сегодня в формате поля даты — раньше блокировку не закончить. */
export const getToday = () => new Date().toISOString().slice(0, 10);

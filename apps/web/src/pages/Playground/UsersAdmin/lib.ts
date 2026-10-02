import { USER_ROLE, type UserRole } from '@tanuki/contracts';
import {
  PRIMARY_COLOR,
  STATUS_DEGRADED_COLOR,
  STATUS_DOWN_COLOR,
  STATUS_OK_COLOR,
} from '@/shared/lib/palette';
import {
  BLOCK_DURATION,
  FILTER_ALL,
  STAFF_ROLE,
  USER_STATUS,
  type BlockDuration,
  type MockUser,
  type Permissions,
  type RoleFilter,
  type StaffRole,
  type StatusFilter,
  type UserStatus,
} from './models';

export const getRoleLabel = (role: UserRole) => {
  switch (role) {
    case USER_ROLE.ADMIN:
      return 'Админ';
    case USER_ROLE.MODERATOR:
      return 'Модератор';
    case USER_ROLE.USER:
      return 'Пользователь';
  }
};

export const getRoleColor = (role: UserRole) => {
  switch (role) {
    case USER_ROLE.ADMIN:
      return PRIMARY_COLOR;
    case USER_ROLE.MODERATOR:
      return 'blue';
    case USER_ROLE.USER:
      return 'gray';
  }
};

export const getStatusLabel = (status: UserStatus) => {
  switch (status) {
    case USER_STATUS.ACTIVE:
      return 'Активен';
    case USER_STATUS.UNVERIFIED:
      return 'Почта не подтверждена';
    case USER_STATUS.BLOCKED:
      return 'Заблокирован';
    case USER_STATUS.DELETION_SCHEDULED:
      return 'Удаляется';
  }
};

/** Подпись статуса во множественном числе — для фильтра. */
export const getStatusFilterLabel = (status: UserStatus) => {
  switch (status) {
    case USER_STATUS.ACTIVE:
      return 'Активные';
    case USER_STATUS.UNVERIFIED:
      return 'Без почты';
    case USER_STATUS.BLOCKED:
      return 'Заблокированные';
    case USER_STATUS.DELETION_SCHEDULED:
      return 'Удаляются';
  }
};

export const getStatusColor = (status: UserStatus) => {
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

export const getBlockDurationLabel = (duration: BlockDuration) => {
  switch (duration) {
    case BLOCK_DURATION.DAY:
      return '1 день';
    case BLOCK_DURATION.WEEK:
      return '7 дней';
    case BLOCK_DURATION.MONTH:
      return '30 дней';
    case BLOCK_DURATION.FOREVER:
      return 'Навсегда';
    case BLOCK_DURATION.CUSTOM:
      return 'Своя дата';
  }
};

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

/** Срок блокировки → `until`; null — навсегда. `customDate` — `YYYY-MM-DD` из поля даты. */
export const getBlockedUntil = (duration: BlockDuration, customDate: string) => {
  if (duration === BLOCK_DURATION.CUSTOM) {
    return customDate ? new Date(`${customDate}T00:00:00Z`).toISOString() : null;
  }
  const days = getBlockDurationDays(duration);
  return days === null ? null : new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
};

/** Права смотрящего на чужую строку. Админа и себя не трогает никто; модератор — только
 *  блокирует и разблокирует обычных пользователей. */
export const getPermissions = (
  viewer: StaffRole,
  selfId: string,
  target: MockUser,
): Permissions => {
  if (target.id === selfId || target.role === USER_ROLE.ADMIN) {
    return { canChangeRole: false, canBlock: false, canDelete: false };
  }
  switch (viewer) {
    case STAFF_ROLE.ADMIN:
      return { canChangeRole: true, canBlock: true, canDelete: true };
    case STAFF_ROLE.MODERATOR:
      return {
        canChangeRole: false,
        canBlock: target.role === USER_ROLE.USER,
        canDelete: false,
      };
  }
};

export const hasAnyPermission = ({ canChangeRole, canBlock, canDelete }: Permissions) =>
  canChangeRole || canBlock || canDelete;

export const filterUsers = (
  users: MockUser[],
  query: string,
  role: RoleFilter,
  status: StatusFilter,
) => {
  const needle = query.trim().toLowerCase();
  return users.filter(
    (user) =>
      (role === FILTER_ALL || user.role === role) &&
      (status === FILTER_ALL || user.status === status) &&
      (!needle ||
        user.username.toLowerCase().includes(needle) ||
        user.email.toLowerCase().includes(needle)),
  );
};

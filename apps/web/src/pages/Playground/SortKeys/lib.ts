import {
  INVITE_STATUS,
  SORT_DIRECTION,
  USER_ROLE,
  USER_STATUS,
  type ManagedUser,
  type SortDirection,
  type UserStatus,
} from '@tanuki/contracts';
import { STATUS_DEGRADED_COLOR, STATUS_DOWN_COLOR, STATUS_OK_COLOR } from '@/shared/lib/palette';
import type { MockInvite } from '../InvitesTable/models';
import {
  INVITE_SORT_KEY,
  SORT_HIGHLIGHT,
  SORT_MARK,
  USER_SORT_KEY,
  type InviteSortKey,
  type SortColumn,
  type SortHighlight,
  type SortMark,
  type SortState,
  type UserSortKey,
  type ValueProps,
} from './models';

/** Бессрочная блокировка — самый дальний срок. */
const FOREVER = '9999-12-31T00:00:00Z';

const ROLE_ORDER = Object.values(USER_ROLE);
const USER_STATUS_ORDER = Object.values(USER_STATUS);
const INVITE_STATUS_ORDER = Object.values(INVITE_STATUS);

/** Пустые значения — всегда внизу, в какую сторону ни сортируй. */
const compareNullable = <T extends string | number>(
  a: T | null,
  b: T | null,
  direction: SortDirection,
) => {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  const result =
    typeof a === 'string' && typeof b === 'string' ? a.localeCompare(b) : Number(a) - Number(b);
  return direction === SORT_DIRECTION.ASC ? result : -result;
};

/** До какого числа действует статус: блокировка или запрошенное удаление; у прочих срока нет. */
const getStatusUntil = (user: ManagedUser) => {
  switch (user.status) {
    case USER_STATUS.BLOCKED:
      return user.blockedUntil ?? FOREVER;
    case USER_STATUS.DELETION_SCHEDULED:
      return user.deletionScheduledAt;
    case USER_STATUS.ACTIVE:
    case USER_STATUS.UNVERIFIED:
      return null;
  }
};

const getUserSortValue = (user: ManagedUser, key: UserSortKey) => {
  switch (key) {
    case USER_SORT_KEY.USERNAME:
      return user.username;
    case USER_SORT_KEY.EMAIL:
      return user.email;
    case USER_SORT_KEY.STATUS:
      return USER_STATUS_ORDER.indexOf(user.status);
    case USER_SORT_KEY.STATUS_UNTIL:
      return getStatusUntil(user);
    case USER_SORT_KEY.INVITED_BY:
      return user.invitedByUsername;
    case USER_SORT_KEY.CREATED_AT:
      return user.createdAt;
    case USER_SORT_KEY.LAST_SEEN_AT:
      return user.lastSeenAt;
  }
};

const getInviteSortValue = (invite: MockInvite, key: InviteSortKey) => {
  switch (key) {
    case INVITE_SORT_KEY.ROLE:
      return ROLE_ORDER.indexOf(invite.role);
    case INVITE_SORT_KEY.CREATED_BY:
      return invite.createdBy;
    case INVITE_SORT_KEY.CREATED_AT:
      return invite.createdAt;
    case INVITE_SORT_KEY.STATUS:
      return INVITE_STATUS_ORDER.indexOf(invite.status);
  }
};

/** Сортировка моков на клиенте — в приложении это делает API; при равенстве — новые сверху. */
export const sortUsers = (users: ManagedUser[], { key, direction }: SortState<UserSortKey>) =>
  [...users].sort(
    (a, b) =>
      compareNullable(getUserSortValue(a, key), getUserSortValue(b, key), direction) ||
      b.createdAt.localeCompare(a.createdAt),
  );

export const sortInvites = (invites: MockInvite[], { key, direction }: SortState<InviteSortKey>) =>
  [...invites].sort(
    (a, b) =>
      compareNullable(getInviteSortValue(a, key), getInviteSortValue(b, key), direction) ||
      b.createdAt.localeCompare(a.createdAt),
  );

/** Какую роль играет значение `key` из столбца `column` при сортировке `sort`. */
export const getSortMark = <Key extends string>(
  column: SortColumn<Key>,
  key: Key,
  sort: SortState<Key>,
): SortMark => {
  if (!column.keys.some((option) => option.key === sort.key)) return SORT_MARK.IDLE;
  return key === sort.key ? SORT_MARK.SORTED : SORT_MARK.PAIR;
};

/** Поправка к стилю значения в ячейке; пусто — значение рисуется как обычно. */
export const getSortValueProps = (highlight: SortHighlight, mark: SortMark): ValueProps => {
  if (mark === SORT_MARK.IDLE) return {};

  switch (highlight) {
    case SORT_HIGHLIGHT.NONE:
    case SORT_HIGHLIGHT.COLUMN:
      return {};
    case SORT_HIGHLIGHT.WEIGHT:
      return mark === SORT_MARK.SORTED
        ? { c: 'var(--mantine-color-text)', fw: 600 }
        : { c: 'dimmed' };
    case SORT_HIGHLIGHT.ACCENT:
      return mark === SORT_MARK.SORTED ? { c: 'var(--mantine-primary-color-filled)', fw: 500 } : {};
  }
};

/** Подложка ячейки активного столбца — только в H3. */
export const getColumnBackground = (highlight: SortHighlight, isActive: boolean) =>
  highlight === SORT_HIGHLIGHT.COLUMN && isActive
    ? 'var(--mantine-color-default-hover)'
    : undefined;

export const getUserStatusLabel = (status: UserStatus) => {
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

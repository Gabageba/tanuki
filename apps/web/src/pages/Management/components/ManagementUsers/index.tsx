import { useState } from 'react';
import { Stack } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import {
  getUserManagementPermissions,
  MANAGED_USERS_SORT,
  SORT_DIRECTION,
  type ManagedUser,
  type ManagedUsersSort,
  type SortDirection,
  type UserRole,
  type UserStatus,
} from '@tanuki/contracts';
import useCurrentUser from '@/entities/user/hooks/useCurrentUser';
import BlockUserModal from './BlockUserModal';
import DeleteUserModal from './DeleteUserModal';
import UserDrawer from './UserDrawer';
import UsersFilters from './UsersFilters';
import UsersList from './UsersList';
import useBlockUser from './hooks/useBlockUser';
import useChangeUserRole from './hooks/useChangeUserRole';
import useDeleteUser from './hooks/useDeleteUser';
import useManagedUsers from './hooks/useManagedUsers';
import useUnblockUser from './hooks/useUnblockUser';
import { getDefaultSortDirection, SEARCH_DEBOUNCE_MS, type UserHandlers } from './models';

/** Вкладка «Пользователи»: поиск и фильтры, таблица постранично, карточка и модалки действий. */
function ManagementUsers() {
  const { data: currentUser } = useCurrentUser();
  const [query, setQuery] = useState('');
  const [role, setRole] = useState<UserRole[]>([]);
  const [status, setStatus] = useState<UserStatus[]>([]);
  const [sort, setSort] = useState<ManagedUsersSort>(MANAGED_USERS_SORT.CREATED_AT);
  const [direction, setDirection] = useState<SortDirection>(SORT_DIRECTION.DESC);
  const [page, setPage] = useState(1);
  // Снимки, а не id: карточка не должна закрываться, если после действия человек выпал из фильтра.
  const [opened, setOpened] = useState<ManagedUser | null>(null);
  const [blockTarget, setBlockTarget] = useState<ManagedUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ManagedUser | null>(null);

  const [debouncedQuery] = useDebouncedValue(query.trim(), SEARCH_DEBOUNCE_MS);
  const users = useManagedUsers({
    page,
    query: debouncedQuery || undefined,
    role,
    status,
    sort,
    direction,
  });
  const changeRole = useChangeUserRole();
  const blockUser = useBlockUser();
  const unblockUser = useUnblockUser();
  const deleteUser = useDeleteUser();

  const resetPage =
    <Value,>(setter: (value: Value) => void) =>
    (value: Value) => {
      setter(value);
      setPage(1);
    };

  /** Повторный клик по тому же столбцу разворачивает направление. */
  const handleSortChange = (next: ManagedUsersSort) => {
    if (next === sort) {
      setDirection(direction === SORT_DIRECTION.ASC ? SORT_DIRECTION.DESC : SORT_DIRECTION.ASC);
    } else {
      setSort(next);
      setDirection(getDefaultSortDirection(next));
    }
    setPage(1);
  };

  const handleReset = () => {
    setQuery('');
    setRole([]);
    setStatus([]);
    setPage(1);
  };

  const handlers: UserHandlers = {
    onOpen: setOpened,
    onRoleChange: (user, nextRole) =>
      changeRole.mutate({ id: user.id, role: nextRole }, { onSuccess: setOpened }),
    onBlock: setBlockTarget,
    onUnblock: (user) => unblockUser.mutate(user.id, { onSuccess: setOpened }),
    onDelete: setDeleteTarget,
  };

  const handleBlock = (payload: Parameters<typeof blockUser.mutate>[0]) =>
    blockUser.mutate(payload, {
      onSuccess: (updated) => {
        setBlockTarget(null);
        setOpened(updated);
      },
    });

  const handleDelete = (user: ManagedUser) =>
    deleteUser.mutate(user.id, {
      onSuccess: () => {
        setDeleteTarget(null);
        setOpened(null);
        // Удалили последнего на странице — уходим на предыдущую, а не на пустую.
        if (users.data?.items.length === 1 && page > 1) setPage(page - 1);
      },
    });

  const permissions =
    opened && currentUser ? getUserManagementPermissions(currentUser, opened) : null;

  return (
    <Stack gap="md">
      <UsersFilters
        query={query}
        role={role}
        status={status}
        onQueryChange={resetPage(setQuery)}
        onRoleChange={resetPage(setRole)}
        onStatusChange={resetPage(setStatus)}
      />

      <UsersList
        users={users}
        selfId={currentUser?.id}
        page={page}
        sort={sort}
        direction={direction}
        onPageChange={setPage}
        onSortChange={handleSortChange}
        onOpen={handlers.onOpen}
        onReset={handleReset}
      />

      <UserDrawer
        user={opened}
        isSelf={opened?.id === currentUser?.id}
        permissions={permissions}
        isRoleChanging={changeRole.isPending}
        isUnblocking={unblockUser.isPending}
        handlers={handlers}
        onClose={() => setOpened(null)}
      />
      <BlockUserModal
        key={`block-${blockTarget?.id}`}
        user={blockTarget}
        isPending={blockUser.isPending}
        onClose={() => setBlockTarget(null)}
        onConfirm={(payload) => blockTarget && handleBlock({ id: blockTarget.id, ...payload })}
      />
      <DeleteUserModal
        key={`delete-${deleteTarget?.id}`}
        user={deleteTarget}
        isPending={deleteUser.isPending}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
      />
    </Stack>
  );
}

export default ManagementUsers;

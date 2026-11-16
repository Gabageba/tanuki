import { useState } from 'react';
import { Stack } from '@mantine/core';
import useManagementUsersQuery from '../../hooks/useManagementUsersQuery';
import {
  getUserManagementPermissions,
  SORT_DIRECTION,
  type ManagedUser,
  type ManagedUsersSort,
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
import useUnblockUser from './hooks/useUnblockUser';
import { getDefaultSortDirection, type UserHandlers } from './models';

/** Вкладка «Пользователи»: поиск и фильтры, таблица постранично, карточка и модалки действий. */
function ManagementUsers() {
  const { data: currentUser } = useCurrentUser();
  const { params, setParams, query: users } = useManagementUsersQuery();
  const { query, role, status, sort, direction, page } = params;
  // Снимки, а не id: карточка не должна закрываться, если после действия человек выпал из фильтра.
  const [opened, setOpened] = useState<ManagedUser | null>(null);
  const [blockTarget, setBlockTarget] = useState<ManagedUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ManagedUser | null>(null);

  const changeRole = useChangeUserRole();
  const blockUser = useBlockUser();
  const unblockUser = useUnblockUser();
  const deleteUser = useDeleteUser();

  /** Повторный клик по тому же столбцу разворачивает направление. */
  const handleSortChange = (next: ManagedUsersSort) => {
    if (next === sort) {
      setParams({
        direction: direction === SORT_DIRECTION.ASC ? SORT_DIRECTION.DESC : SORT_DIRECTION.ASC,
        page: 1,
      });
      return;
    }
    setParams({ sort: next, direction: getDefaultSortDirection(next), page: 1 });
  };

  const handleReset = () => {
    setParams({ query: '', role: [], status: [], page: 1 });
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
        if (users.data?.items.length === 1 && page > 1) setParams({ page: page - 1 });
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
        onQueryChange={(query) => setParams({ query, page: 1 })}
        onRoleChange={(role) => setParams({ role, page: 1 })}
        onStatusChange={(status) => setParams({ status, page: 1 })}
      />

      <UsersList
        users={users}
        selfId={currentUser?.id}
        page={page}
        sort={sort}
        direction={direction}
        onPageChange={(page) => setParams({ page })}
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

import { useState } from 'react';
import { Stack } from '@mantine/core';
import { filterUsers } from '../lib';
import {
  FILTER_ALL,
  MOBILE_LAYOUT,
  PAGE_SIZE,
  type MockUser,
  type PanelConfig,
  type RoleFilter,
  type RowHandlers,
  type StaffRole,
  type StatusFilter,
  type UserActions,
} from '../models';
import BlockModal from './BlockModal';
import DeleteModal from './DeleteModal';
import EmptyResult from './EmptyResult';
import UserDrawer from './UserDrawer';
import UsersCards from './UsersCards';
import UsersFilters from './UsersFilters';
import UsersPagination from './UsersPagination';
import UsersTable from './UsersTable';

type Props = {
  users: MockUser[];
  viewer: StaffRole;
  selfId: string;
  actions: UserActions;
  config: PanelConfig;
  /** Вариант стоит в рамке телефона: брейкпоинты смотрят на окно, а не на рамку. */
  narrow?: boolean;
  /** Чтобы сразу показать пустой результат поиска. */
  initialQuery?: string;
};

/** Содержимое экрана «Пользователи»: фильтры, таблица или карточки, пагинация и модалки. */
function UsersPanel({
  users,
  viewer,
  selfId,
  actions,
  config,
  narrow = false,
  initialQuery = '',
}: Props) {
  const [query, setQuery] = useState(initialQuery);
  const [role, setRole] = useState<RoleFilter>(FILTER_ALL);
  const [status, setStatus] = useState<StatusFilter>(FILTER_ALL);
  const [page, setPage] = useState(1);
  const [blockId, setBlockId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [drawerId, setDrawerId] = useState<string | null>(null);

  const filtered = filterUsers(users, query, role, status);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages);
  const pageUsers = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const findUser = (id: string | null) => users.find((user) => user.id === id) ?? null;

  const resetPage =
    <Value,>(setter: (value: Value) => void) =>
    (value: Value) => {
      setter(value);
      setPage(1);
    };

  const handleReset = () => {
    setQuery('');
    setRole(FILTER_ALL);
    setStatus(FILTER_ALL);
    setPage(1);
  };

  const handlers: RowHandlers = {
    onOpen: (user) => setDrawerId(user.id),
    onRoleChange: (user, nextRole) => actions.onRoleChange(user.id, nextRole),
    onBlock: (user) => setBlockId(user.id),
    onUnblock: (user) => actions.onUnblock(user.id),
    onDelete: (user) => setDeleteId(user.id),
  };

  const list =
    narrow && config.mobile === MOBILE_LAYOUT.CARDS ? (
      <UsersCards
        users={pageUsers}
        mode={config.actions}
        viewer={viewer}
        selfId={selfId}
        handlers={handlers}
      />
    ) : (
      <UsersTable
        users={pageUsers}
        layout={config.table}
        mode={config.actions}
        viewer={viewer}
        selfId={selfId}
        handlers={handlers}
      />
    );

  return (
    <Stack gap="md">
      <UsersFilters
        layout={config.filters}
        narrow={narrow}
        query={query}
        role={role}
        status={status}
        onQueryChange={resetPage(setQuery)}
        onRoleChange={resetPage(setRole)}
        onStatusChange={resetPage(setStatus)}
      />

      {filtered.length ? (
        <>
          {list}
          <UsersPagination
            page={currentPage}
            total={filtered.length}
            narrow={narrow}
            onChange={setPage}
          />
        </>
      ) : (
        <EmptyResult onReset={handleReset} />
      )}

      <UserDrawer
        user={findUser(drawerId)}
        viewer={viewer}
        selfId={selfId}
        narrow={narrow}
        onClose={() => setDrawerId(null)}
        handlers={handlers}
      />
      <BlockModal
        key={`block-${blockId}`}
        user={findUser(blockId)}
        form={config.block}
        onClose={() => setBlockId(null)}
        onConfirm={(payload) => {
          if (blockId) actions.onBlock(blockId, payload);
          setBlockId(null);
        }}
      />
      <DeleteModal
        key={`delete-${deleteId}`}
        user={findUser(deleteId)}
        confirm={config.confirm}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) actions.onDelete(deleteId);
          setDeleteId(null);
          setDrawerId(null);
        }}
      />
    </Stack>
  );
}

export default UsersPanel;

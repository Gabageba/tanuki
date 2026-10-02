import type { UseQueryResult } from '@tanstack/react-query';
import {
  MANAGED_USERS_PAGE_SIZE,
  type ManagedUsersResponse,
  type ManagedUsersSort,
  type SortDirection,
} from '@tanuki/contracts';
import ListPagination from '@/shared/ui/ListPagination';
import type { UserHandlers } from './models';
import UsersEmptyResult from './UsersEmptyResult';
import UsersTable from './UsersTable';
import UsersTableSkeleton from './UsersTableSkeleton';

type Props = {
  users: UseQueryResult<ManagedUsersResponse>;
  selfId: string | undefined;
  page: number;
  sort: ManagedUsersSort;
  direction: SortDirection;
  onPageChange: (page: number) => void;
  onSortChange: (sort: ManagedUsersSort) => void;
  onOpen: UserHandlers['onOpen'];
  onReset: () => void;
};

/** Скелетон на первой загрузке, пустой результат или таблица с пагинацией. */
function UsersList({
  users,
  selfId,
  page,
  sort,
  direction,
  onPageChange,
  onSortChange,
  onOpen,
  onReset,
}: Props) {
  if (users.isPending) {
    return <UsersTableSkeleton />;
  }

  if (!users.data?.total) {
    return <UsersEmptyResult onReset={onReset} />;
  }

  return (
    <>
      <UsersTable
        users={users.data.items}
        selfId={selfId}
        sort={sort}
        direction={direction}
        onSortChange={onSortChange}
        onOpen={onOpen}
      />
      <ListPagination
        page={page}
        total={users.data.total}
        pageSize={MANAGED_USERS_PAGE_SIZE}
        onChange={onPageChange}
      />
    </>
  );
}

export default UsersList;

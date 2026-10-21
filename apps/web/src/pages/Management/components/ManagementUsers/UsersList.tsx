import type { UseQueryResult } from '@tanstack/react-query';
import {
  MANAGED_USERS_PAGE_SIZE,
  type ManagedUsersResponse,
  type ManagedUsersSort,
  type SortDirection,
} from '@tanuki/contracts';
import ListPagination from '@/shared/ui/ListPagination';
import QueryBlock from '@/shared/ui/QueryBlock';
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

/** Скелетон, пока ждём ответ, пустой результат или таблица с пагинацией. */
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
  return (
    <QueryBlock
      query={users}
      skeleton={<UsersTableSkeleton />}
      empty={<UsersEmptyResult onReset={onReset} />}
      isEmpty={({ total }) => total === 0}
    >
      {({ items, total }) => (
        <>
          <UsersTable
            users={items}
            selfId={selfId}
            sort={sort}
            direction={direction}
            onSortChange={onSortChange}
            onOpen={onOpen}
          />
          <ListPagination
            page={page}
            total={total}
            pageSize={MANAGED_USERS_PAGE_SIZE}
            onChange={onPageChange}
          />
        </>
      )}
    </QueryBlock>
  );
}

export default UsersList;

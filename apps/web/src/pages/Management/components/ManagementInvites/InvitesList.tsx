import type { UseQueryResult } from '@tanstack/react-query';
import { EmptyState } from '@mantine/core';
import { TicketIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import {
  INVITES_PAGE_SIZE,
  type Invite,
  type InvitesResponse,
  type InvitesSort,
  type SortDirection,
} from '@tanuki/contracts';
import ListPagination from '@/shared/ui/ListPagination';
import QueryBlock from '@/shared/ui/QueryBlock';
import InvitesEmptyResult from './InvitesEmptyResult';
import InvitesTable from './InvitesTable';
import InvitesTableSkeleton from './InvitesTableSkeleton';

type Props = {
  invites: UseQueryResult<InvitesResponse>;
  /** Выбран хоть один фильтр — пустой ответ значит «ничего не найдено», а не «пока нет». */
  hasFilters: boolean;
  page: number;
  sort: InvitesSort;
  direction: SortDirection;
  onPageChange: (page: number) => void;
  onSortChange: (sort: InvitesSort) => void;
  onOpen: (invite: Invite) => void;
  onReset: () => void;
};

/** Скелетон, пока ждём ответ, «пока нет», «ничего не найдено» или таблица с пагинацией. */
function InvitesList({
  invites,
  hasFilters,
  page,
  sort,
  direction,
  onPageChange,
  onSortChange,
  onOpen,
  onReset,
}: Props) {
  const { t } = useTranslation();

  const empty = hasFilters ? (
    <InvitesEmptyResult onReset={onReset} />
  ) : (
    <EmptyState
      title={t('noInvitesYet')}
      description={t('createInviteToInviteSomeone')}
      icon={<TicketIcon />}
    />
  );

  return (
    <QueryBlock
      query={invites}
      skeleton={<InvitesTableSkeleton />}
      empty={empty}
      isEmpty={({ total }) => total === 0}
    >
      {({ items, total }) => (
        <>
          <InvitesTable
            invites={items}
            sort={sort}
            direction={direction}
            onSortChange={onSortChange}
            onOpen={onOpen}
          />
          <ListPagination
            page={page}
            total={total}
            pageSize={INVITES_PAGE_SIZE}
            onChange={onPageChange}
          />
        </>
      )}
    </QueryBlock>
  );
}

export default InvitesList;

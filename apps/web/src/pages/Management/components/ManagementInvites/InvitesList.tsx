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
import BlockLoader from '@/shared/ui/BlockLoader';
import ListPagination from '@/shared/ui/ListPagination';
import InvitesEmptyResult from './InvitesEmptyResult';
import InvitesTable from './InvitesTable';

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

/** Спиннер на первой загрузке, «пока нет», «ничего не найдено» или таблица с пагинацией. */
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

  // Приглашений часто нет вовсе — таблица-скелетон сменилась бы пустым состоянием.
  if (invites.isPending) {
    return <BlockLoader />;
  }

  if (!invites.data?.total) {
    return hasFilters ? (
      <InvitesEmptyResult onReset={onReset} />
    ) : (
      <EmptyState
        title={t('noInvitesYet')}
        description={t('createInviteToInviteSomeone')}
        icon={<TicketIcon />}
      />
    );
  }

  return (
    <>
      <InvitesTable
        invites={invites.data.items}
        sort={sort}
        direction={direction}
        onSortChange={onSortChange}
        onOpen={onOpen}
      />
      <ListPagination
        page={page}
        total={invites.data.total}
        pageSize={INVITES_PAGE_SIZE}
        onChange={onPageChange}
      />
    </>
  );
}

export default InvitesList;

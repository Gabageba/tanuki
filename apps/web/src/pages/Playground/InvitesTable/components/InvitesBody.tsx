import ListPagination from '@/shared/ui/ListPagination';
import {
  DATA_STATE,
  PAGE_SIZE,
  TABLE_LAYOUT,
  type DataState,
  type InviteSort,
  type MockInvite,
  type PanelConfig,
  type SortState,
} from '../models';
import InvitesEmpty from './InvitesEmpty';
import InvitesEmptyResult from './InvitesEmptyResult';
import InvitesList from './InvitesList';
import InvitesTableSkeleton from './InvitesTableSkeleton';

type Props = {
  dataState: DataState;
  /** Сколько приглашений вообще есть, до фильтров. */
  total: number;
  /** Сколько прошло фильтры. */
  filtered: number;
  pageItems: MockInvite[];
  page: number;
  config: PanelConfig;
  selfName: string;
  sortState: SortState;
  onPageChange: (page: number) => void;
  onSortChange: (sort: InviteSort) => void;
  onOpen: (invite: MockInvite) => void;
  onRevoke: (id: string) => void;
  onReset: () => void;
};

/** Скелетон на загрузке, «пока нет», «ничего не найдено» или таблица с пагинацией. */
function InvitesBody({
  dataState,
  total,
  filtered,
  pageItems,
  page,
  config,
  selfName,
  sortState,
  onPageChange,
  onSortChange,
  onOpen,
  onRevoke,
  onReset,
}: Props) {
  if (dataState === DATA_STATE.LOADING) {
    return <InvitesTableSkeleton layout={config.table} outcome={config.outcome} />;
  }

  if (total === 0) {
    return <InvitesEmpty />;
  }

  if (filtered === 0) {
    return <InvitesEmptyResult onReset={onReset} />;
  }

  return (
    <>
      <InvitesList
        invites={pageItems}
        config={config}
        selfName={selfName}
        sortState={sortState}
        onSortChange={onSortChange}
        onOpen={onOpen}
        onRevoke={onRevoke}
      />
      {config.table !== TABLE_LAYOUT.CURRENT && (
        <ListPagination page={page} total={filtered} pageSize={PAGE_SIZE} onChange={onPageChange} />
      )}
    </>
  );
}

export default InvitesBody;

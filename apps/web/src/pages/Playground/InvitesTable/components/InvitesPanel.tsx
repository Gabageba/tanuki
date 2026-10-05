import { useState } from 'react';
import { Stack } from '@mantine/core';
import {
  INVITE_STATUS,
  SORT_DIRECTION,
  USER_ROLE,
  type InviteStatus,
  type UserRole,
} from '@tanuki/contracts';
import { canManageInvite, filterInvites, getDefaultSortDirection, sortInvites } from '../lib';
import {
  DATA_STATE,
  INVITE_SORT,
  LINK_RECOVERY,
  PAGE_SIZE,
  TABLE_LAYOUT,
  type DataState,
  type InviteActions,
  type InviteSort,
  type MockInvite,
  type PanelConfig,
  type SortState,
  type Viewer,
} from '../models';
import InviteCreatedModal from './InviteCreatedModal';
import InviteDrawer from './InviteDrawer';
import InvitesBody from './InvitesBody';
import InvitesFilters from './InvitesFilters';
import RevokeModal from './RevokeModal';

type Props = {
  invites: MockInvite[];
  viewer: Viewer;
  selfName: string;
  dataState: DataState;
  config: PanelConfig;
  actions: InviteActions;
  /** Рамка телефона: фильтры друг под другом, карточка снизу. */
  narrow?: boolean;
};

/** «Ничего не найдено» — на сочетании, которого в моках нет: отозванные приглашения в модераторы. */
const NOTHING_FOUND_STATUS: InviteStatus[] = [INVITE_STATUS.REVOKED];
const NOTHING_FOUND_ROLE: UserRole[] = [USER_ROLE.MODERATOR];

const DEFAULT_SORT: SortState = { sort: INVITE_SORT.STATUS, direction: SORT_DIRECTION.ASC };

/** Вкладка «Приглашения» в одном варианте: фильтры, таблица постранично, карточка и модалки. */
function InvitesPanel({
  invites,
  viewer,
  selfName,
  dataState,
  config,
  actions,
  narrow = false,
}: Props) {
  const isNothingFound = dataState === DATA_STATE.NOTHING_FOUND;
  const [status, setStatus] = useState<InviteStatus[]>(isNothingFound ? NOTHING_FOUND_STATUS : []);
  const [role, setRole] = useState<UserRole[]>(isNothingFound ? NOTHING_FOUND_ROLE : []);
  const [sortState, setSortState] = useState<SortState>(DEFAULT_SORT);
  const [page, setPage] = useState(1);
  const [openedId, setOpenedId] = useState<string | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<MockInvite | null>(null);
  const [reissued, setReissued] = useState<MockInvite | null>(null);

  const isCurrent = config.table === TABLE_LAYOUT.CURRENT;
  const source = dataState === DATA_STATE.EMPTY ? [] : invites;
  // T0 — как сейчас: весь список, новые сверху, без фильтров и страниц.
  const visible = isCurrent
    ? sortInvites(source, INVITE_SORT.CREATED_AT, SORT_DIRECTION.DESC)
    : sortInvites(filterInvites(source, status, role), sortState.sort, sortState.direction);
  const pageItems = isCurrent ? visible : visible.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  // По id, а не снимком: после отзыва карточка показывает новый статус.
  const opened = invites.find((invite) => invite.id === openedId) ?? null;

  const resetPage =
    <Value,>(setter: (value: Value) => void) =>
    (value: Value) => {
      setter(value);
      setPage(1);
    };

  const handleSortChange = (next: InviteSort) => {
    setSortState(({ sort, direction }) => ({
      sort: next,
      direction:
        next === sort
          ? direction === SORT_DIRECTION.ASC
            ? SORT_DIRECTION.DESC
            : SORT_DIRECTION.ASC
          : getDefaultSortDirection(next),
    }));
    setPage(1);
  };

  const handleReset = () => {
    setStatus([]);
    setRole([]);
    setPage(1);
  };

  const handleRevoke = (invite: MockInvite) => {
    actions.onRevoke(invite.id);
    setRevokeTarget(null);
  };

  const handleReissue = (invite: MockInvite) => {
    setOpenedId(null);
    setReissued(actions.onReissue(invite.id));
  };

  return (
    <Stack gap="md">
      {!isCurrent && source.length > 0 && (
        <InvitesFilters
          status={status}
          role={role}
          narrow={narrow}
          onStatusChange={resetPage(setStatus)}
          onRoleChange={resetPage(setRole)}
        />
      )}

      <InvitesBody
        dataState={dataState}
        total={source.length}
        filtered={visible.length}
        pageItems={pageItems}
        page={page}
        config={config}
        selfName={selfName}
        sortState={sortState}
        onPageChange={setPage}
        onSortChange={handleSortChange}
        onOpen={(invite) => setOpenedId(invite.id)}
        onRevoke={actions.onRevoke}
        onReset={handleReset}
      />

      <InviteDrawer
        invite={opened}
        config={config}
        isOwn={opened?.createdBy === selfName}
        canManage={opened !== null && canManageInvite(opened, viewer, selfName)}
        narrow={narrow}
        onRevokeRequest={setRevokeTarget}
        onRevoke={handleRevoke}
        onReissue={handleReissue}
        onClose={() => setOpenedId(null)}
      />
      <RevokeModal
        invite={revokeTarget}
        pattern={config.message}
        onClose={() => setRevokeTarget(null)}
        onConfirm={() => revokeTarget && handleRevoke(revokeTarget)}
      />
      <InviteCreatedModal
        invite={reissued}
        isLinkStored={config.link === LINK_RECOVERY.STORED}
        pattern={config.message}
        onClose={() => setReissued(null)}
      />
    </Stack>
  );
}

export default InvitesPanel;

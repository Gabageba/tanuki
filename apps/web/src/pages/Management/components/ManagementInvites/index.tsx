import { useState } from 'react';
import { Stack } from '@mantine/core';
import {
  getInvitePermissions,
  SORT_DIRECTION,
  type CreateInviteResponse,
  type Invite,
  type InvitesSort,
  type InviteStatus,
  type SortDirection,
  type UserRole,
} from '@tanuki/contracts';
import useCurrentUser from '@/entities/user/hooks/useCurrentUser';
import InviteCreatedModal from './InviteCreatedModal';
import InviteDrawer from './InviteDrawer';
import InvitesFilters from './InvitesFilters';
import InvitesList from './InvitesList';
import RevokeInviteModal from './RevokeInviteModal';
import useInvites from './hooks/useInvites';
import useReissueInvite from './hooks/useReissueInvite';
import useRevokeInvite from './hooks/useRevokeInvite';
import { DEFAULT_INVITES_QUERY, getDefaultSortDirection } from './models';

/** Вкладка «Приглашения»: фильтры, таблица постранично, карточка и модалки действий. По умолчанию
 *  новые сверху — только что созданное приглашение сразу видно в начале первой страницы. */
function ManagementInvites() {
  const { data: currentUser } = useCurrentUser();
  const [status, setStatus] = useState<InviteStatus[]>(DEFAULT_INVITES_QUERY.status);
  const [role, setRole] = useState<UserRole[]>(DEFAULT_INVITES_QUERY.role);
  const [sort, setSort] = useState<InvitesSort>(DEFAULT_INVITES_QUERY.sort);
  const [direction, setDirection] = useState<SortDirection>(DEFAULT_INVITES_QUERY.direction);
  const [page, setPage] = useState(DEFAULT_INVITES_QUERY.page);
  // Снимки, а не id: карточка не должна закрываться, если после отзыва приглашение выпало из фильтра.
  const [opened, setOpened] = useState<Invite | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<Invite | null>(null);
  const [reissued, setReissued] = useState<CreateInviteResponse | null>(null);

  const invites = useInvites({ page, status, role, sort, direction });
  const revokeInvite = useRevokeInvite();
  const reissueInvite = useReissueInvite();

  const hasFilters = status.length > 0 || role.length > 0;
  const isEmpty = !hasFilters && invites.data?.total === 0;

  const resetPage =
    <Value,>(setter: (value: Value) => void) =>
    (value: Value) => {
      setter(value);
      setPage(1);
    };

  /** Повторный клик по тому же столбцу разворачивает направление. */
  const handleSortChange = (next: InvitesSort) => {
    if (next === sort) {
      setDirection(direction === SORT_DIRECTION.ASC ? SORT_DIRECTION.DESC : SORT_DIRECTION.ASC);
    } else {
      setSort(next);
      setDirection(getDefaultSortDirection(next));
    }
    setPage(1);
  };

  const handleReset = () => {
    setStatus([]);
    setRole([]);
    setPage(1);
  };

  const handleRevoke = (invite: Invite) =>
    revokeInvite.mutate(invite.id, {
      onSuccess: (updated) => {
        setRevokeTarget(null);
        setOpened(updated);
      },
    });

  const handleReissue = (invite: Invite) =>
    reissueInvite.mutate(invite.id, {
      onSuccess: (created) => {
        setOpened(null);
        setReissued(created);
      },
    });

  const permissions = opened && currentUser ? getInvitePermissions(currentUser, opened) : null;

  return (
    <Stack gap="md">
      {!isEmpty && (
        <InvitesFilters
          status={status}
          role={role}
          onStatusChange={resetPage(setStatus)}
          onRoleChange={resetPage(setRole)}
        />
      )}

      <InvitesList
        invites={invites}
        hasFilters={hasFilters}
        page={page}
        sort={sort}
        direction={direction}
        onPageChange={setPage}
        onSortChange={handleSortChange}
        onOpen={setOpened}
        onReset={handleReset}
      />

      <InviteDrawer
        invite={opened}
        isOwn={opened !== null && opened.createdById === currentUser?.id}
        permissions={permissions}
        isReissuing={reissueInvite.isPending}
        onRevoke={setRevokeTarget}
        onReissue={handleReissue}
        onClose={() => setOpened(null)}
      />
      <RevokeInviteModal
        invite={revokeTarget}
        isPending={revokeInvite.isPending}
        onClose={() => setRevokeTarget(null)}
        onConfirm={() => revokeTarget && handleRevoke(revokeTarget)}
      />
      <InviteCreatedModal invite={reissued} onClose={() => setReissued(null)} />
    </Stack>
  );
}

export default ManagementInvites;

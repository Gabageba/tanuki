import type { TFunction } from 'i18next';
import {
  INVITE_STATUS,
  INVITES_SORT,
  SORT_DIRECTION,
  USER_ROLE,
  type InvitableRole,
  type Invite,
  type InvitesSort,
  type InviteStatus,
} from '@tanuki/contracts';
import { STATUS_DEGRADED_COLOR, STATUS_DOWN_COLOR, STATUS_OK_COLOR } from '@/shared/lib/palette';
import { ROUTE_PATHS } from '@/shared/lib/routes';

/** Сколько живёт приглашение — как `INVITE_TTL_MS` в API. */
export const INVITE_TTL_DAYS = 7;

const DAY_MS = 24 * 60 * 60 * 1000;

/** Направление при первом клике по столбцу: даты — новые сверху, остальное — по порядку. */
export const getDefaultSortDirection = (sort: InvitesSort) => {
  switch (sort) {
    case INVITES_SORT.CREATED_AT:
      return SORT_DIRECTION.DESC;
    case INVITES_SORT.ROLE:
    case INVITES_SORT.CREATED_BY:
    case INVITES_SORT.STATUS:
      return SORT_DIRECTION.ASC;
  }
};

export const getInviteStatusLabel = (status: InviteStatus, t: TFunction) => {
  switch (status) {
    case INVITE_STATUS.ACTIVE:
      return t('activeNeuter');
    case INVITE_STATUS.USED:
      return t('used');
    case INVITE_STATUS.EXPIRED:
      return t('expired');
    case INVITE_STATUS.REVOKED:
      return t('revoked');
  }
};

/** Подпись статуса в фильтре — во множественном числе. */
export const getInviteStatusFilterLabel = (status: InviteStatus, t: TFunction) => {
  switch (status) {
    case INVITE_STATUS.ACTIVE:
      return t('activePlural');
    case INVITE_STATUS.USED:
      return t('usedPlural');
    case INVITE_STATUS.EXPIRED:
      return t('expiredPlural');
    case INVITE_STATUS.REVOKED:
      return t('revokedPlural');
  }
};

export const getInviteStatusColor = (status: InviteStatus) => {
  switch (status) {
    case INVITE_STATUS.ACTIVE:
      return STATUS_OK_COLOR;
    case INVITE_STATUS.USED:
      return 'blue';
    case INVITE_STATUS.EXPIRED:
      return STATUS_DEGRADED_COLOR;
    case INVITE_STATUS.REVOKED:
      return STATUS_DOWN_COLOR;
  }
};

/** Что получит приглашённый — подпись под ролью в модалке создания. */
export const getInvitableRoleDescription = (role: InvitableRole, t: TFunction) => {
  switch (role) {
    case USER_ROLE.MODERATOR:
      return t('likeUserPlusBlocksAndInvites');
    case USER_ROLE.USER:
      return t('readsKeepsLibraryAndBookmarks');
  }
};

export const getInviteLink = (code: string) =>
  `${window.location.origin}${ROUTE_PATHS.REGISTER}?invite=${code}`;

/** Полных дней до истечения; 0 — истекает в ближайшие сутки. */
export const getDaysLeft = (expiresAt: string) =>
  Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / DAY_MS));

/** Заголовок карточки — от кого приглашение. */
export const getInviteDrawerTitle = (invite: Invite, isOwn: boolean, t: TFunction) => {
  if (isOwn) return t('inviteFromYou');
  return invite.createdByUsername
    ? t('inviteFromUsername', { username: invite.createdByUsername })
    : t('inviteFromConsole');
};

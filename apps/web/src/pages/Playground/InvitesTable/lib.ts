import {
  INVITABLE_ROLE,
  INVITE_STATUS,
  SORT_DIRECTION,
  USER_ROLE,
  type InvitableRole,
  type InviteStatus,
  type SortDirection,
  type UserRole,
} from '@tanuki/contracts';
import {
  PRIMARY_COLOR,
  STATUS_DEGRADED_COLOR,
  STATUS_DOWN_COLOR,
  STATUS_OK_COLOR,
} from '@/shared/lib/palette';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import {
  APP_MODAL,
  DEMO_MODAL,
  INVITE_SORT,
  MESSAGE_TONE,
  NEUTRAL_COLOR,
  NOW,
  OUTCOME_COLUMN,
  STATUS_ORDER,
  VIEWER,
  type AppModal,
  type DemoModal,
  type InviteSort,
  type MessageTone,
  type MockInvite,
  type NeutralColor,
  type OutcomeColumn,
  type Viewer,
} from './models';

const DAY_MS = 24 * 60 * 60 * 1000;

export const getInviteStatusLabel = (status: InviteStatus) => {
  switch (status) {
    case INVITE_STATUS.ACTIVE:
      return 'Активно';
    case INVITE_STATUS.USED:
      return 'Использовано';
    case INVITE_STATUS.EXPIRED:
      return 'Истекло';
    case INVITE_STATUS.REVOKED:
      return 'Отозвано';
  }
};

/** Подпись статуса в фильтре — во множественном числе. */
export const getInviteStatusFilterLabel = (status: InviteStatus) => {
  switch (status) {
    case INVITE_STATUS.ACTIVE:
      return 'Активные';
    case INVITE_STATUS.USED:
      return 'Использованные';
    case INVITE_STATUS.EXPIRED:
      return 'Истёкшие';
    case INVITE_STATUS.REVOKED:
      return 'Отозванные';
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

export const getRoleLabel = (role: UserRole) => {
  switch (role) {
    case USER_ROLE.ADMIN:
      return 'Админ';
    case USER_ROLE.MODERATOR:
      return 'Модератор';
    case USER_ROLE.USER:
      return 'Пользователь';
  }
};

export const getRoleColor = (role: UserRole) => {
  switch (role) {
    case USER_ROLE.ADMIN:
      return PRIMARY_COLOR;
    case USER_ROLE.MODERATOR:
      return 'blue';
    case USER_ROLE.USER:
      return 'gray';
  }
};

/** Что получит приглашённый — подпись под ролью в C1. */
export const getRoleDescription = (role: UserRole) => {
  switch (role) {
    case USER_ROLE.ADMIN:
      return 'Всё, что может модератор, плюс назначает модераторов и удаляет аккаунты.';
    case USER_ROLE.MODERATOR:
      return 'Как пользователь, плюс блокирует пользователей и выпускает приглашения.';
    case USER_ROLE.USER:
      return 'Читает, ведёт библиотеку и закладки.';
  }
};

/** «1 день», «3 дня», «6 дней». */
export const formatDays = (count: number) => {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return `${count} день`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${count} дня`;
  return `${count} дней`;
};

/** Полных дней до истечения; 0 — истекает в ближайшие сутки. */
export const getDaysLeft = (expiresAt: string) =>
  Math.max(0, Math.floor((new Date(expiresAt).getTime() - new Date(NOW).getTime()) / DAY_MS));

/** «Ещё 6 дней» / «Истекает сегодня» — сколько осталось активному приглашению. */
export const formatTimeLeft = (expiresAt: string) => {
  const days = getDaysLeft(expiresAt);
  return days === 0 ? 'Истекает сегодня' : `Ещё ${formatDays(days)}`;
};

/** «9 октября 2026 г.» с неразрывными пробелами — дата внутри фразы не переносится. */
export const formatWordedDate = (isoDate: string) => {
  const date = new Intl.DateTimeFormat('ru', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(isoDate));
  return date.replace(/ /g, ' ');
};

export const getInviteLink = (code: string) =>
  `${window.location.origin}${ROUTE_PATHS.REGISTER}?invite=${code}`;

/** Админ отзывает любые активные приглашения, модератор — только свои. */
export const canManageInvite = (invite: MockInvite, viewer: Viewer, selfName: string) => {
  if (invite.status !== INVITE_STATUS.ACTIVE) return false;
  switch (viewer) {
    case VIEWER.ADMIN:
      return true;
    case VIEWER.MODERATOR:
      return invite.createdBy === selfName;
  }
};

/** С какого направления начинается сортировка: даты — сначала новые, прочее — по порядку. */
export const getDefaultSortDirection = (sort: InviteSort) => {
  switch (sort) {
    case INVITE_SORT.CREATED_AT:
    case INVITE_SORT.EXPIRES_AT:
      return SORT_DIRECTION.DESC;
    case INVITE_SORT.STATUS:
    case INVITE_SORT.ROLE:
    case INVITE_SORT.CREATED_BY:
    case INVITE_SORT.USED_BY:
      return SORT_DIRECTION.ASC;
  }
};

const ROLE_ORDER: UserRole[] = [USER_ROLE.USER, USER_ROLE.MODERATOR, USER_ROLE.ADMIN];

/** Пустые значения (скрипт, никто не использовал) — всегда в конце, в любом направлении. */
const compareNullable = (a: string | null, b: string | null, sign: number) => {
  if (a === b) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return a.localeCompare(b) * sign;
};

const compareBy = (a: MockInvite, b: MockInvite, sort: InviteSort, sign: number) => {
  switch (sort) {
    case INVITE_SORT.STATUS:
      return (STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status)) * sign;
    case INVITE_SORT.ROLE:
      return (ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role)) * sign;
    case INVITE_SORT.CREATED_BY:
      return compareNullable(a.createdBy, b.createdBy, sign);
    case INVITE_SORT.USED_BY:
      return compareNullable(a.usedBy, b.usedBy, sign);
    case INVITE_SORT.CREATED_AT:
      return a.createdAt.localeCompare(b.createdAt) * sign;
    case INVITE_SORT.EXPIRES_AT:
      return a.expiresAt.localeCompare(b.expiresAt) * sign;
  }
};

/** Внутри равных — новые сверху. На сервере это будет ORDER BY по столбцу и createdAt DESC. */
export const sortInvites = (invites: MockInvite[], sort: InviteSort, direction: SortDirection) => {
  const sign = direction === SORT_DIRECTION.ASC ? 1 : -1;
  return [...invites].sort(
    (a, b) => compareBy(a, b, sort, sign) || b.createdAt.localeCompare(a.createdAt),
  );
};

/** Пустой фильтр — без ограничения. */
export const filterInvites = (invites: MockInvite[], status: InviteStatus[], role: UserRole[]) =>
  invites.filter(
    (invite) =>
      (status.length === 0 || status.includes(invite.status)) &&
      (role.length === 0 || role.includes(invite.role)),
  );

/** Какие роли смотрящий может выдать приглашением: модератор — только «Пользователь». */
export const getInvitableRoles = (viewer: Viewer): InvitableRole[] => {
  switch (viewer) {
    case VIEWER.ADMIN:
      return Object.values(INVITABLE_ROLE);
    case VIEWER.MODERATOR:
      return [USER_ROLE.USER];
  }
};

/** Заголовок столбца с итогом в T3; null — столбца нет (N4). */
export const getOutcomeColumnTitle = (column: OutcomeColumn) => {
  switch (column) {
    case OUTCOME_COLUMN.SUMMARY:
      return 'Итог';
    case OUTCOME_COLUMN.RESULT:
      return 'Результат';
    case OUTCOME_COLUMN.ISSUE:
      return 'Исход';
    case OUTCOME_COLUMN.DETAILS:
      return 'Подробности';
    case OUTCOME_COLUMN.IN_STATUS:
      return null;
  }
};

const getNeutralColor = (neutral: NeutralColor) => {
  switch (neutral) {
    case NEUTRAL_COLOR.GRAY:
      return 'gray';
    case NEUTRAL_COLOR.BLUE:
      return 'blue';
    case NEUTRAL_COLOR.ACCENT:
      return PRIMARY_COLOR;
  }
};

export const getMessageToneColor = (
  tone: MessageTone,
  neutral: NeutralColor = NEUTRAL_COLOR.ACCENT,
) => {
  switch (tone) {
    case MESSAGE_TONE.DANGER:
      return 'red';
    case MESSAGE_TONE.WARNING:
      return STATUS_DEGRADED_COLOR;
    case MESSAGE_TONE.NEUTRAL:
      return getNeutralColor(neutral);
    case MESSAGE_TONE.SUCCESS:
      return 'teal';
  }
};

export const getMessageToneLabel = (tone: MessageTone) => {
  switch (tone) {
    case MESSAGE_TONE.DANGER:
      return 'danger';
    case MESSAGE_TONE.WARNING:
      return 'warning';
    case MESSAGE_TONE.NEUTRAL:
      return 'neutral';
    case MESSAGE_TONE.SUCCESS:
      return 'success';
  }
};

/** Подпись кнопки, открывающей модалку на оси M. */
export const getDemoModalLabel = (modal: DemoModal) => {
  switch (modal) {
    case DEMO_MODAL.REVOKE:
      return 'Отзыв приглашения';
    case DEMO_MODAL.BLOCK:
      return 'Блокировка';
    case DEMO_MODAL.DELETE_USER:
      return 'Удаление пользователя';
    case DEMO_MODAL.CLEAR_CACHE:
      return 'Очистка кэша';
    case DEMO_MODAL.AGE:
      return 'Вам есть 18?';
    case DEMO_MODAL.RESET_FILTERS:
      return 'Сброс фильтров';
  }
};

/** Заголовок карточки: от кого приглашение. */
export const getInviteDrawerTitle = (invite: MockInvite, isOwn: boolean) => {
  if (isOwn) return 'Приглашение от вас';
  return invite.createdBy ? `Приглашение от ${invite.createdBy}` : 'Приглашение из консоли';
};

/** Цвет тона как CSS-значение — для полос и иконок без Mantine-компонента с `color`. */
export const getMessageToneCssColor = (
  tone: MessageTone,
  neutral: NeutralColor = NEUTRAL_COLOR.ACCENT,
) =>
  // Серый нейтральный — цвет пояснений, а не залитый серый: иначе иконка выглядит неактивной кнопкой.
  tone === MESSAGE_TONE.NEUTRAL && neutral === NEUTRAL_COLOR.GRAY
    ? 'var(--mantine-color-dimmed)'
    : `var(--mantine-color-${getMessageToneColor(tone, neutral)}-filled)`;

export const getAppModalTitle = (modal: AppModal) => {
  switch (modal) {
    case APP_MODAL.DELETE_OWN_ACCOUNT:
      return 'Удалить аккаунт';
    case APP_MODAL.DELETE_USER:
      return 'Удаление аккаунта';
    case APP_MODAL.BLOCK:
      return 'Блокировка';
    case APP_MODAL.REVOKE_INVITE:
      return 'Отзыв приглашения';
    case APP_MODAL.CLEAR_CACHE:
      return 'Очистить кеш браузера';
    case APP_MODAL.RESET_FILTERS:
      return 'Сбросить другие фильтры?';
    case APP_MODAL.AGE:
      return 'Вам есть 18?';
    case APP_MODAL.NEW_INVITE:
      return 'Новое приглашение';
    case APP_MODAL.CHANGE_PASSWORD:
      return 'Сменить пароль';
    case APP_MODAL.CHANGE_EMAIL:
      return 'Сменить почту';
    case APP_MODAL.EXPORT_BOOKMARKS:
      return 'Экспорт закладок';
    case APP_MODAL.IMPORT_BOOKMARKS:
      return 'Импорт закладок';
    case APP_MODAL.IMPORT_FROM_SOURCE:
      return 'Импорт из источника';
    case APP_MODAL.NEW_AVATAR:
      return 'Новый аватар';
    case APP_MODAL.ADD_TITLE_MANUALLY:
      return 'Добавить тайтл вручную';
    case APP_MODAL.SOURCE_LOGIN:
      return 'Вход в MangaLib';
    case APP_MODAL.INVITE_CREATED:
      return 'Приглашение создано';
  }
};

/** Тон модалки: совпадает с цветом главной кнопки и тем, насколько действие обратимо. */
export const getAppModalTone = (modal: AppModal) => {
  switch (modal) {
    case APP_MODAL.DELETE_OWN_ACCOUNT:
    case APP_MODAL.DELETE_USER:
    case APP_MODAL.BLOCK:
    case APP_MODAL.REVOKE_INVITE:
      return MESSAGE_TONE.DANGER;
    case APP_MODAL.CLEAR_CACHE:
    case APP_MODAL.RESET_FILTERS:
    case APP_MODAL.AGE:
      return MESSAGE_TONE.WARNING;
    case APP_MODAL.NEW_INVITE:
    case APP_MODAL.CHANGE_PASSWORD:
    case APP_MODAL.CHANGE_EMAIL:
    case APP_MODAL.EXPORT_BOOKMARKS:
    case APP_MODAL.IMPORT_BOOKMARKS:
    case APP_MODAL.IMPORT_FROM_SOURCE:
    case APP_MODAL.NEW_AVATAR:
    case APP_MODAL.ADD_TITLE_MANUALLY:
    case APP_MODAL.SOURCE_LOGIN:
      return MESSAGE_TONE.NEUTRAL;
    case APP_MODAL.INVITE_CREATED:
      return MESSAGE_TONE.SUCCESS;
  }
};

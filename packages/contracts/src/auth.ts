import { z } from 'zod';
import { LanguageSchema } from './language';
import { SORT_DIRECTION, SortDirectionSchema } from './source';
import type { EnumLiteralsOf } from './utils';

export const USER_ROLE = {
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  USER: 'user',
} as const;
export type UserRole = EnumLiteralsOf<typeof USER_ROLE>;

export const UserRoleSchema = z.enum(USER_ROLE);

/** admin и moderator — персонал, им открыта страница «Управление». Что именно каждый может сделать
 *  с другим аккаунтом, решает getUserManagementPermissions. */
export const isStaffRole = (role: UserRole | undefined): boolean =>
  role === USER_ROLE.ADMIN || role === USER_ROLE.MODERATOR;

/**
 * Роли, которые можно выдать инвайтом через /invites или сменой роли в «Управлении». ADMIN сюда
 * не входит — единственный админ заводится CLI-скриптом (см. apps/api/scripts/create-invite.ts),
 * через API его выпустить нельзя.
 */
export const INVITABLE_ROLE = {
  MODERATOR: USER_ROLE.MODERATOR,
  USER: USER_ROLE.USER,
} as const;
export type InvitableRole = EnumLiteralsOf<typeof INVITABLE_ROLE>;
export const InvitableRoleSchema = z.enum(INVITABLE_ROLE);

/**
 * Lifecycle of an invite. ACTIVE is the only state that still admits a registration — the other
 * three are terminal and differ only in *why* the invite can no longer be used.
 */
export const INVITE_STATUS = {
  ACTIVE: 'active',
  USED: 'used',
  EXPIRED: 'expired',
  REVOKED: 'revoked',
} as const;
export type InviteStatus = EnumLiteralsOf<typeof INVITE_STATUS>;

export const InviteStatusSchema = z.enum(INVITE_STATUS);

/** a-z, A-Z, 0-9, `_` and `.`, 3-24 chars — kept exactly as typed, compared case-insensitively. */
export const USERNAME_PATTERN = /^[a-zA-Z0-9_.]{3,24}$/;

export const UsernameSchema = z.string().regex(USERNAME_PATTERN);

export const EmailSchema = z.email();

export const PasswordSchema = z.string().min(8).max(128);

export const CurrentUserSchema = z.object({
  id: z.string(),
  email: EmailSchema,
  username: UsernameSchema,
  role: UserRoleSchema,
  language: LanguageSchema,
  /** Ссылка с версией в query — после смены аватара она другая, так что кешировать её можно навсегда. */
  avatarUrl: z.string().nullable(),
  /** Дата регистрации — `YYYY-MM-DDTHH:MM:SSZ`. */
  createdAt: z.string(),
});
export type CurrentUser = z.infer<typeof CurrentUserSchema>;

export const UpdateProfileRequestSchema = z.object({
  username: UsernameSchema,
});
export type UpdateProfileRequest = z.infer<typeof UpdateProfileRequestSchema>;

/** Сколько байт исходной картинки принимает загрузка аватара — дальше сервер её всё равно ужмёт. */
export const AVATAR_MAX_BYTES = 10 * 1024 * 1024;

export const RegisterRequestSchema = z.object({
  inviteCode: z.string().min(1),
  email: EmailSchema,
  username: UsernameSchema,
  password: PasswordSchema,
  language: LanguageSchema,
});
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

export const CheckUsernameResponseSchema = z.object({
  available: z.boolean(),
});
export type CheckUsernameResponse = z.infer<typeof CheckUsernameResponseSchema>;

export const LoginRequestSchema = z.object({
  /** Email or username. */
  login: z.string().min(1),
  password: z.string().min(1),
  remember: z.boolean(),
  /** Аккаунт ждёт удаления — вход с этим флагом отменяет удаление. */
  cancelDeletion: z.boolean().optional(),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const VerifyEmailRequestSchema = z.object({
  token: z.string().min(1),
});
export type VerifyEmailRequest = z.infer<typeof VerifyEmailRequestSchema>;

export const ResendVerificationRequestSchema = z.object({
  email: EmailSchema,
  language: LanguageSchema,
});
export type ResendVerificationRequest = z.infer<typeof ResendVerificationRequestSchema>;

export const ForgotPasswordRequestSchema = z.object({
  email: EmailSchema,
  language: LanguageSchema,
});
export type ForgotPasswordRequest = z.infer<typeof ForgotPasswordRequestSchema>;

export const ResetPasswordRequestSchema = z.object({
  token: z.string().min(1),
  password: PasswordSchema,
});
export type ResetPasswordRequest = z.infer<typeof ResetPasswordRequestSchema>;

export const ChangeEmailRequestSchema = z.object({
  newEmail: EmailSchema,
  password: z.string().min(1),
});
export type ChangeEmailRequest = z.infer<typeof ChangeEmailRequestSchema>;

/** Сколько цифр в коде, который приходит на новую почту при её смене. */
export const EMAIL_CHANGE_CODE_LENGTH = 6;

export const ConfirmEmailChangeRequestSchema = z.object({
  code: z.string().length(EMAIL_CHANGE_CODE_LENGTH).regex(/^\d+$/),
});
export type ConfirmEmailChangeRequest = z.infer<typeof ConfirmEmailChangeRequestSchema>;

export const ChangePasswordRequestSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: PasswordSchema,
  signOutOtherDevices: z.boolean(),
});
export type ChangePasswordRequest = z.infer<typeof ChangePasswordRequestSchema>;

export const DeleteAccountRequestSchema = z.object({
  password: z.string().min(1),
});
export type DeleteAccountRequest = z.infer<typeof DeleteAccountRequestSchema>;

export const DEVICE_TYPE = {
  DESKTOP: 'desktop',
  MOBILE: 'mobile',
  TABLET: 'tablet',
  UNKNOWN: 'unknown',
} as const;
export type DeviceType = EnumLiteralsOf<typeof DEVICE_TYPE>;
export const DeviceTypeSchema = z.enum(DEVICE_TYPE);

export const SessionSchema = z.object({
  id: z.string(),
  /** Название и версия браузера из User-Agent; null — не распознан. */
  browser: z.string().nullable(),
  os: z.string().nullable(),
  deviceType: DeviceTypeSchema,
  /** IP, с которого выполнен вход. */
  ip: z.string().nullable(),
  /** `YYYY-MM-DDTHH:MM:SSZ`, обновляется не чаще раза в час. */
  lastSeenAt: z.string(),
  createdAt: z.string(),
  isCurrent: z.boolean(),
});
export type Session = z.infer<typeof SessionSchema>;

export const SessionsResponseSchema = z.object({
  items: z.array(SessionSchema),
});
export type SessionsResponse = z.infer<typeof SessionsResponseSchema>;

export const InviteSchema = z.object({
  id: z.string(),
  role: UserRoleSchema,
  status: InviteStatusSchema,
  /** null для инвайта, созданного CLI-скриптом до первого пользователя (см. apps/api), и если
   *  автор уже удалён. По id интерфейс узнаёт свои приглашения. */
  createdById: z.string().nullable(),
  createdByUsername: z.string().nullable(),
  usedByUsername: z.string().nullable(),
  /** null — у зарегистрировавшегося нет своей картинки или его уже нет. */
  usedByAvatarUrl: z.string().nullable(),
  /** null у отозванных до появления этого поля и если отозвавший уже удалён. */
  revokedByUsername: z.string().nullable(),
  createdAt: z.string(),
  expiresAt: z.string(),
  usedAt: z.string().nullable(),
  revokedAt: z.string().nullable(),
});
export type Invite = z.infer<typeof InviteSchema>;

export const CreateInviteRequestSchema = z.object({
  role: InvitableRoleSchema,
});
export type CreateInviteRequest = z.infer<typeof CreateInviteRequestSchema>;

/** Only the creation response ever carries the plaintext code — it isn't stored anywhere. */
export const CreateInviteResponseSchema = InviteSchema.extend({
  code: z.string(),
});
export type CreateInviteResponse = z.infer<typeof CreateInviteResponseSchema>;

export const InviteCheckResponseSchema = z.object({
  valid: z.boolean(),
});
export type InviteCheckResponse = z.infer<typeof InviteCheckResponseSchema>;

/**
 * Состояние аккаунта в «Управлении». Не хранится колонкой — выводится из полей users, причём по
 * приоритету: действующая блокировка перекрывает запрошенное удаление, то — неподтверждённую почту.
 */
export const USER_STATUS = {
  ACTIVE: 'active',
  UNVERIFIED: 'unverified',
  BLOCKED: 'blocked',
  DELETION_SCHEDULED: 'deletionScheduled',
} as const;
export type UserStatus = EnumLiteralsOf<typeof USER_STATUS>;
export const UserStatusSchema = z.enum(USER_STATUS);

/** Сколько строк на странице таблицы пользователей. */
export const MANAGED_USERS_PAGE_SIZE = 10;

/** Длина причины блокировки — её показывают в таблице и на экране входа. */
export const BLOCK_REASON_MAX_LENGTH = 500;

export const ManagedUserSchema = z.object({
  id: z.string(),
  username: UsernameSchema,
  email: EmailSchema,
  role: UserRoleSchema,
  status: UserStatusSchema,
  avatarUrl: z.string().nullable(),
  /** До какого момента блокировка — `YYYY-MM-DDTHH:MM:SSZ`; null у бессрочной и у незаблокированных. */
  blockedUntil: z.string().nullable(),
  blockReason: z.string().nullable(),
  /** Когда аккаунт удалится, если человек сам запросил удаление. */
  deletionScheduledAt: z.string().nullable(),
  /** null — приглашение выпустил CLI-скрипт или пригласивший уже удалён. */
  invitedByUsername: z.string().nullable(),
  createdAt: z.string(),
  /** Последний вход или активность; null — ни разу не входил. */
  lastSeenAt: z.string().nullable(),
});
export type ManagedUser = z.infer<typeof ManagedUserSchema>;

/** Столбец, по которому сортируется таблица пользователей. */
export const MANAGED_USERS_SORT = {
  USERNAME: 'username',
  STATUS: 'status',
  INVITED_BY: 'invitedBy',
  CREATED_AT: 'createdAt',
} as const;
export type ManagedUsersSort = EnumLiteralsOf<typeof MANAGED_USERS_SORT>;

export const ManagedUsersSortSchema = z.enum(MANAGED_USERS_SORT);

/** Повторённый `?role=a&role=b` приходит массивом, одиночный `?role=a` — строкой: приводим к массиву. */
const queryArray = <T extends z.ZodType>(schema: T) =>
  z
    .preprocess((value) => (value === undefined ? undefined : [value].flat()), z.array(schema))
    .optional();

export const ManagedUsersQuerySchema = z.object({
  /** С единицы. */
  page: z.coerce.number().int().min(1).default(1),
  /** Подстрока имени или почты. */
  query: z.string().trim().max(100).optional(),
  /** Любая из ролей; пусто — все. */
  role: queryArray(UserRoleSchema),
  /** Любой из статусов; пусто — все. */
  status: queryArray(UserStatusSchema),
  /** По умолчанию — сначала новые. */
  sort: ManagedUsersSortSchema.default(MANAGED_USERS_SORT.CREATED_AT),
  direction: SortDirectionSchema.default(SORT_DIRECTION.DESC),
});
export type ManagedUsersQuery = z.infer<typeof ManagedUsersQuerySchema>;

export const ManagedUsersResponseSchema = z.object({
  items: z.array(ManagedUserSchema),
  /** Сколько всего подходит под фильтры — для счётчика и пагинации. */
  total: z.number(),
});
export type ManagedUsersResponse = z.infer<typeof ManagedUsersResponseSchema>;

/** Сколько строк на странице таблицы приглашений. */
export const INVITES_PAGE_SIZE = 10;

/** По чему сортируется таблица приглашений. «Результат» не сортируется — в нём данные разного
 *  смысла; по дате создания — только по умолчанию, своего заголовка у неё нет. */
export const INVITES_SORT = {
  CREATED_AT: 'createdAt',
  ROLE: 'role',
  CREATED_BY: 'createdBy',
  STATUS: 'status',
} as const;
export type InvitesSort = EnumLiteralsOf<typeof INVITES_SORT>;

export const InvitesSortSchema = z.enum(INVITES_SORT);

export const InvitesQuerySchema = z.object({
  /** С единицы. */
  page: z.coerce.number().int().min(1).default(1),
  /** Любой из статусов; пусто — все. */
  status: queryArray(InviteStatusSchema),
  /** Любая из ролей; пусто — все. */
  role: queryArray(UserRoleSchema),
  /** По умолчанию — сначала активные, внутри статуса новые сверху. */
  sort: InvitesSortSchema.default(INVITES_SORT.CREATED_AT),
  direction: SortDirectionSchema.default(SORT_DIRECTION.DESC),
});
export type InvitesQuery = z.infer<typeof InvitesQuerySchema>;

export const InvitesResponseSchema = z.object({
  items: z.array(InviteSchema),
  /** Сколько всего подходит под фильтры — для счётчика и пагинации. */
  total: z.number(),
});
export type InvitesResponse = z.infer<typeof InvitesResponseSchema>;

export const ChangeUserRoleRequestSchema = z.object({
  role: InvitableRoleSchema,
});
export type ChangeUserRoleRequest = z.infer<typeof ChangeUserRoleRequestSchema>;

export const BlockUserRequestSchema = z.object({
  /** `YYYY-MM-DDTHH:MM:SSZ`; null — навсегда. */
  until: z.string().datetime().nullable(),
  reason: z.string().trim().max(BLOCK_REASON_MAX_LENGTH).nullable(),
});
export type BlockUserRequest = z.infer<typeof BlockUserRequestSchema>;

export type UserManagementPermissions = {
  canChangeRole: boolean;
  canBlock: boolean;
  canDelete: boolean;
};

type UserManagementSide = {
  id: string;
  role: UserRole;
};

/**
 * Что `actor` может сделать с аккаунтом `target`. Одна функция на API (проверка) и интерфейс
 * (какие кнопки показать): себя и админа не меняет никто; админ назначает и снимает модераторов,
 * блокирует и удаляет; модератор только блокирует и разблокирует обычных пользователей.
 */
export const getUserManagementPermissions = (
  actor: UserManagementSide,
  target: UserManagementSide,
): UserManagementPermissions => {
  if (target.id === actor.id || target.role === USER_ROLE.ADMIN) {
    return { canChangeRole: false, canBlock: false, canDelete: false };
  }
  switch (actor.role) {
    case USER_ROLE.ADMIN:
      return { canChangeRole: true, canBlock: true, canDelete: true };
    case USER_ROLE.MODERATOR:
      return { canChangeRole: false, canBlock: target.role === USER_ROLE.USER, canDelete: false };
    case USER_ROLE.USER:
      return { canChangeRole: false, canBlock: false, canDelete: false };
  }
};

export type InvitePermissions = {
  canRevoke: boolean;
  canReissue: boolean;
};

type InviteManagementSide = Pick<Invite, 'status' | 'role' | 'createdById'>;

/**
 * Что `actor` может сделать с приглашением. Одна функция на API (проверка) и интерфейс (какие
 * кнопки показать): только с активным; админ — с любым, модератор — только со своим.
 * Перевыпуск сохраняет роль, а приглашение в админы через API не выпускается — его только отзывают.
 */
export const getInvitePermissions = (
  actor: UserManagementSide,
  invite: InviteManagementSide,
): InvitePermissions => {
  if (invite.status !== INVITE_STATUS.ACTIVE) {
    return { canRevoke: false, canReissue: false };
  }
  const isAllowed =
    actor.role === USER_ROLE.ADMIN ||
    (actor.role === USER_ROLE.MODERATOR && invite.createdById === actor.id);
  return { canRevoke: isAllowed, canReissue: isAllowed && invite.role !== USER_ROLE.ADMIN };
};

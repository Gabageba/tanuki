import { z } from 'zod';
import { LanguageSchema } from './language';
import type { EnumLiteralsOf } from './utils';

export const USER_ROLE = {
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  USER: 'user',
} as const;
export type UserRole = EnumLiteralsOf<typeof USER_ROLE>;

export const UserRoleSchema = z.enum(USER_ROLE);

/** admin и moderator — единственный админ (создаётся CLI-скриптом) отличается от модератора
 *  только правом управлять ролями, которое ещё не реализовано. */
export const isStaffRole = (role: UserRole | undefined): boolean =>
  role === USER_ROLE.ADMIN || role === USER_ROLE.MODERATOR;

/**
 * Роли, которые можно выдать инвайтом через /invites. ADMIN сюда не входит — единственный админ
 * заводится CLI-скриптом (см. apps/api/scripts/create-invite.ts), через API его выпустить нельзя.
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
  /** null для инвайта, созданного CLI-скриптом до первого пользователя (см. apps/api). */
  createdByUsername: z.string().nullable(),
  usedByUsername: z.string().nullable(),
  createdAt: z.string(),
  expiresAt: z.string(),
  usedAt: z.string().nullable(),
});
export type Invite = z.infer<typeof InviteSchema>;

export const InvitesResponseSchema = z.object({
  items: z.array(InviteSchema),
});
export type InvitesResponse = z.infer<typeof InvitesResponseSchema>;

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

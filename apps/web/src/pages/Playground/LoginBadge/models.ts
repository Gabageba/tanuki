import type { EnumLiteralsOf, SourceId, SourceLoginRequirement } from '@tanuki/contracts';

/** Ширина рамки «мобилка»: узкий телефон, на котором строка должна читаться целиком. */
export const MOBILE_FRAME_WIDTH = 360;

/** Колонка «Общих» настроек на десктопе. */
export const DESKTOP_WIDTH = 620;

/** Пометка о входе: истёкшая сессия важнее требования, как в `SourceLoginBadge`. */
export const LOGIN_MARK = {
  REQUIRED: 'required',
  OPTIONAL: 'optional',
  RELOGIN: 'relogin',
} as const;
export type LoginMark = EnumLiteralsOf<typeof LOGIN_MARK>;

/** Как пометка нарисована — по одному на вариант. */
export const MARK_VIEW = {
  BADGE: 'badge',
  ICON: 'icon',
  /** L2a — иконка в muted-подложке, квадрат со скруглением. */
  ICON_MUTED: 'iconMuted',
  /** L2b — muted-«бейдж без текста» высотой как бейдж xs. */
  ICON_PILL: 'iconPill',
  /** L2c — muted-кружок. */
  ICON_ROUND: 'iconRound',
  WORD: 'word',
  SHORT: 'short',
  ADAPTIVE: 'adaptive',
  AVATAR: 'avatar',
} as const;
export type MarkView = EnumLiteralsOf<typeof MARK_VIEW>;

/** Какими иконками различаются «обязателен» и «по желанию» (ось I для L2b). */
export const ICON_SET = {
  LOCKS: 'locks',
  LOCK_SIGN_IN: 'lockSignIn',
  KEY_SIGN_IN: 'keySignIn',
  LOCK_GIFT: 'lockGift',
  LOCK_USER_PLUS: 'lockUserPlus',
} as const;
export type IconSet = EnumLiteralsOf<typeof ICON_SET>;

export type DemoSource = {
  id: SourceId;
  title: string;
  domain: string;
  /** null — в источник войти нельзя, пометки нет нигде. */
  loginRequirement: SourceLoginRequirement | null;
  isLoggedIn: boolean;
  isReloginRequired: boolean;
  /** Готовая строка «Вход даст: …» для профиля. */
  benefits: string;
};

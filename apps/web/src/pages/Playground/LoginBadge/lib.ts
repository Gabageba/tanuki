import { SOURCE_LOGIN_REQUIREMENT, type SourceLoginRequirement } from '@tanuki/contracts';
import { STATUS_DEGRADED_COLOR } from '@/shared/lib/palette';
import { LOGIN_MARK, MARK_VIEW, type DemoSource, type LoginMark, type MarkView } from './models';

const getRequirementMark = (requirement: SourceLoginRequirement) => {
  switch (requirement) {
    case SOURCE_LOGIN_REQUIREMENT.REQUIRED:
      return LOGIN_MARK.REQUIRED;
    case SOURCE_LOGIN_REQUIREMENT.OPTIONAL:
      return LOGIN_MARK.OPTIONAL;
  }
};

/** Профиль помечает каждый источник, в который можно войти. */
export const getProfileMark = (source: DemoSource): LoginMark | null => {
  if (source.isReloginRequired) return LOGIN_MARK.RELOGIN;
  if (!source.loginRequirement) return null;
  return getRequirementMark(source.loginRequirement);
};

/** Настройки — только там, где войти ещё предстоит: у вошедших пометки нет. */
export const getSettingsMark = (source: DemoSource): LoginMark | null => {
  if (source.isLoggedIn && !source.isReloginRequired) return null;
  return getProfileMark(source);
};

export const getMarkColor = (mark: LoginMark) => {
  switch (mark) {
    case LOGIN_MARK.REQUIRED:
      return 'red';
    case LOGIN_MARK.OPTIONAL:
      return 'gray';
    case LOGIN_MARK.RELOGIN:
      return STATUS_DEGRADED_COLOR;
  }
};

/** Полный текст — как в приложении сейчас. */
export const getMarkLabel = (mark: LoginMark) => {
  switch (mark) {
    case LOGIN_MARK.REQUIRED:
      return 'Вход обязателен';
    case LOGIN_MARK.OPTIONAL:
      return 'Вход по желанию';
    case LOGIN_MARK.RELOGIN:
      return 'Нужен повторный вход';
  }
};

/** L3b — короткий текст, который читается без легенды. */
export const getMarkShortLabel = (mark: LoginMark) => {
  switch (mark) {
    case LOGIN_MARK.REQUIRED:
      return 'Нужен вход';
    case LOGIN_MARK.OPTIONAL:
      return 'Можно войти';
    case LOGIN_MARK.RELOGIN:
      return 'Войти заново';
  }
};

/** Размер и форма muted-иконки L2a–L2c; у остальных видов её нет. */
export const getMutedIconShape = (view: MarkView) => {
  switch (view) {
    case MARK_VIEW.ICON_MUTED:
      return { size: 22, iconSize: 14, radius: 'sm' };
    case MARK_VIEW.ICON_PILL:
      return { size: 16, iconSize: 11, radius: 'sm' };
    case MARK_VIEW.ICON_ROUND:
      return { size: 22, iconSize: 13, radius: 'xl' };
    case MARK_VIEW.BADGE:
    case MARK_VIEW.ICON:
    case MARK_VIEW.WORD:
    case MARK_VIEW.SHORT:
    case MARK_VIEW.ADAPTIVE:
    case MARK_VIEW.AVATAR:
      return null;
  }
};

/** Метки, которые встречаются в списке, — в порядке LOGIN_MARK, для легенды. */
export const getPresentMarks = (marks: (LoginMark | null)[]) =>
  Object.values(LOGIN_MARK).filter((mark) => marks.includes(mark));

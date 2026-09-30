import { PRIMARY_COLOR, STATUS_DEGRADED_COLOR, STATUS_OK_COLOR } from '@/shared/lib/palette';
import {
  ACCOUNT_STATE,
  DEMO_FAMILIES,
  LOCK_REASON,
  LOGIN_BENEFIT,
  LOGIN_MARK,
  LOGIN_REQUIREMENT,
  type AccountState,
  type DemoFamily,
  type DemoSource,
  type LockReason,
  type LoginBenefit,
  type LoginMark,
  type LoginRequirement,
} from './models';

export const getAccountStateLabel = (state: AccountState) => {
  switch (state) {
    case ACCOUNT_STATE.NONE:
      return 'Аккаунт не привязан';
    case ACCOUNT_STATE.ACTIVE:
      return 'Вход выполнен';
    case ACCOUNT_STATE.RELOGIN:
      return 'Нужно войти заново';
  }
};

export const getAccountStateColor = (state: AccountState) => {
  switch (state) {
    case ACCOUNT_STATE.NONE:
      return PRIMARY_COLOR;
    case ACCOUNT_STATE.ACTIVE:
      return STATUS_OK_COLOR;
    case ACCOUNT_STATE.RELOGIN:
      return STATUS_DEGRADED_COLOR;
  }
};

export const getRequirementLabel = (requirement: LoginRequirement) => {
  switch (requirement) {
    case LOGIN_REQUIREMENT.REQUIRED:
      return 'Вход обязателен';
    case LOGIN_REQUIREMENT.OPTIONAL:
      return 'Вход по желанию';
  }
};

export const getBenefitLabel = (benefit: LoginBenefit) => {
  switch (benefit) {
    case LOGIN_BENEFIT.ADULT_TITLES:
      return 'тайтлы 18+';
    case LOGIN_BENEFIT.HIDDEN_TITLES:
      return 'тайтлы, скрытые от гостей';
    case LOGIN_BENEFIT.BOOKMARKS_IMPORT:
      return 'импорт закладок';
  }
};

export const getLoginMarkLabel = (mark: LoginMark) => {
  switch (mark) {
    case LOGIN_MARK.LOGIN_NEEDED:
      return 'Нужен вход';
    case LOGIN_MARK.RELOGIN:
      return 'Войдите заново';
    case LOGIN_MARK.OPTIONAL:
      return 'Вход по желанию';
  }
};

export const getLoginMarkColor = (mark: LoginMark) => {
  switch (mark) {
    case LOGIN_MARK.LOGIN_NEEDED:
      return PRIMARY_COLOR;
    case LOGIN_MARK.RELOGIN:
      return STATUS_DEGRADED_COLOR;
    case LOGIN_MARK.OPTIONAL:
      return 'gray';
  }
};

export const getFamilySources = (family: DemoFamily, sources: DemoSource[]) =>
  sources.filter((source) => source.login?.family === family.key);

/** Пометка для строки настроек: вошедшим и источникам без входа она не нужна. */
export const getLoginMark = (source: DemoSource): LoginMark | null => {
  const { login } = source;
  const family = DEMO_FAMILIES.find(({ key }) => key === login?.family);
  if (!login || !family) return null;

  switch (family.state) {
    case ACCOUNT_STATE.ACTIVE:
      return null;
    case ACCOUNT_STATE.RELOGIN:
      return LOGIN_MARK.RELOGIN;
    case ACCOUNT_STATE.NONE:
      return login.requirement === LOGIN_REQUIREMENT.REQUIRED
        ? LOGIN_MARK.LOGIN_NEEDED
        : LOGIN_MARK.OPTIONAL;
  }
};

/** Одной строкой — что даст вход на этом источнике; обязательность называет бейдж рядом. */
export const getBenefitsText = (benefits: LoginBenefit[]) =>
  `Вход даст: ${benefits.map(getBenefitLabel).join(', ')}`;

export const getLockReasonTitle = (reason: LockReason) => {
  switch (reason) {
    case LOCK_REASON.SOURCE:
      return 'Источник закрыт';
    case LOCK_REASON.RELOGIN:
      return 'Сессия истекла';
    case LOCK_REASON.TITLE:
      return 'Тайтл только для вошедших';
  }
};

export const getLockReasonDescription = (reason: LockReason) => {
  switch (reason) {
    case LOCK_REASON.SOURCE:
      return 'ReadManga открывается только через ваш аккаунт Grouple. Один вход откроет все источники сети.';
    case LOCK_REASON.RELOGIN:
      return 'HentaiLib перестал принимать сохранённый вход в LibSocial. Войдите заново — закладки и прогресс на месте.';
    case LOCK_REASON.TITLE:
      return 'MangaLib показывает этот тайтл только авторизованным. Остальные тайтлы источника открываются и без входа.';
  }
};

export const getLockReasonAction = (reason: LockReason) => {
  switch (reason) {
    case LOCK_REASON.SOURCE:
      return 'Войти в Grouple';
    case LOCK_REASON.RELOGIN:
      return 'Войти заново';
    case LOCK_REASON.TITLE:
      return 'Войти в LibSocial';
  }
};

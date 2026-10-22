import type { CurrentUser } from '@tanuki/contracts';

/** Последний вошедший пользователь — по нему приложение пускает внутрь без сети: скачанное читается
 *  в самолёте и с холодного старта. Пишется следом за кешем `me` (QueryClientProvider): выход и
 *  истёкшая сессия его удаляют. «Очистить кеш браузера» его не трогает — вход остаётся. */
export const LAST_USER_STORAGE_KEY = 'tanuki-last-user';

export const readLastUser = (): CurrentUser | null => {
  try {
    const raw = window.localStorage.getItem(LAST_USER_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CurrentUser) : null;
  } catch {
    return null;
  }
};

export const writeLastUser = (user: CurrentUser | null) => {
  try {
    if (user) {
      window.localStorage.setItem(LAST_USER_STORAGE_KEY, JSON.stringify(user));
    } else {
      window.localStorage.removeItem(LAST_USER_STORAGE_KEY);
    }
  } catch {
    // localStorage может быть недоступен (приватный режим) — без сети тогда не войти.
  }
};

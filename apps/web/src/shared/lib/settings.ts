import type { ColorScheme, Language, ViewMode } from '@tanuki/contracts';

export const SETTINGS_STORAGE_KEY = 'tanuki-settings';

export type Settings = {
  colorScheme?: ColorScheme;
  viewMode?: ViewMode;
  language?: Language;
  exclusiveFilterConfirmDismissed?: boolean;
  collapsedSearchSources?: string[];
};

export const readSettings = (): Settings => {
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Settings) : {};
  } catch {
    return {};
  }
};

/**
 * Для авторизованных каждый патч дополнительно летит в БД, чтобы настройки не терялись между
 * устройствами — обработчик на время сессии логина регистрирует UserSettingsSync
 * (app/Providers/UserSettingsSync.tsx), гость пишет только сюда, в localStorage.
 */
let syncHandler: ((patch: Settings) => void) | null = null;
export const setSettingsSyncHandler = (handler: ((patch: Settings) => void) | null) => {
  syncHandler = handler;
};

export const writeSettings = (patch: Settings) => {
  try {
    window.localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({ ...readSettings(), ...patch }),
    );
  } catch {
    // localStorage может быть недоступен (приватный режим)
  }
  syncHandler?.(patch);
};

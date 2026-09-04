import type { MantineColorScheme } from '@mantine/core';
import type { ViewMode } from './viewMode';

export const SETTINGS_STORAGE_KEY = 'tanuki-settings';

type Settings = {
  colorScheme?: MantineColorScheme;
  viewMode?: ViewMode;
};

export const readSettings = (): Settings => {
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Settings) : {};
  } catch {
    return {};
  }
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
};

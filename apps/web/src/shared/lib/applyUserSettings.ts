import type { MantineColorScheme } from '@mantine/core';
import type { i18n as I18n } from 'i18next';
import type { UserSettings } from '@tanuki/contracts';
import { writeSettings } from './settings';

type Appliers = {
  colorScheme: MantineColorScheme;
  setColorScheme: (colorScheme: MantineColorScheme) => void;
  i18n: I18n;
};

/**
 * Серверные настройки — в живое состояние и localStorage: тема, язык и то, что читается из
 * localStorage. Так их применяет вход (UserSettingsSync) и восстановление из резервной копии.
 */
export const applyUserSettings = (
  settings: UserSettings,
  { colorScheme, setColorScheme, i18n }: Appliers,
) => {
  if (settings.colorScheme && settings.colorScheme !== colorScheme) {
    setColorScheme(settings.colorScheme);
  }
  if (settings.language && settings.language !== i18n.language) {
    void i18n.changeLanguage(settings.language);
  }
  writeSettings({
    viewMode: settings.viewMode,
    exclusiveFilterConfirmDismissed: settings.exclusiveFilterConfirmDismissed,
    collapsedSearchSources: settings.collapsedSearchSources,
  });
};

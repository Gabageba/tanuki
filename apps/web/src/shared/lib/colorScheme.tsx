import { DesktopIcon, MoonIcon, SunIcon } from '@phosphor-icons/react';
import type { TFunction } from 'i18next';
import { COLOR_SCHEME, type ColorScheme } from '@tanuki/contracts';

export const getColorSchemeLabel = (colorScheme: ColorScheme, t: TFunction) => {
  switch (colorScheme) {
    case COLOR_SCHEME.LIGHT:
      return t('light');
    case COLOR_SCHEME.DARK:
      return t('dark');
    case COLOR_SCHEME.AUTO:
      return t('system');
  }
};

export const getColorSchemeIcon = (colorScheme: ColorScheme) => {
  switch (colorScheme) {
    case COLOR_SCHEME.LIGHT:
      return <SunIcon />;
    case COLOR_SCHEME.DARK:
      return <MoonIcon />;
    case COLOR_SCHEME.AUTO:
      return <DesktopIcon />;
  }
};

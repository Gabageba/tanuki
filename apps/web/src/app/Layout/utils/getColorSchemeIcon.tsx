import { DesktopIcon, MoonIcon, SunIcon } from '@phosphor-icons/react';
import type { ColorScheme } from '@/app/Providers/models';
import { COLOR_SCHEME } from '@/app/Providers/models';

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

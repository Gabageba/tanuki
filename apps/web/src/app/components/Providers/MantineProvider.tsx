import type { ReactNode } from 'react';
import {
  createTheme,
  localStorageColorSchemeManager,
  MantineProvider as ExternalMantineProvider,
} from '@mantine/core';
import {
  COLOR_SCHEME,
  CSS_VARIABLES_RESOLVER,
  FONT_FAMILY_MONOSPACE,
  FONT_FAMILY_SANS,
  NEUTRAL_DARK_SHADES,
  NEUTRAL_LIGHT_SHADES,
  type ColorScheme,
} from './models';
import {
  PRIMARY_COLOR,
  PRIMARY_COLOR_SHADES,
  PRIMARY_SHADE,
  RATING_COLOR,
  RATING_COLOR_SHADES,
  STATUS_DEGRADED_COLOR,
  STATUS_DEGRADED_COLOR_SHADES,
  STATUS_DOWN_COLOR,
  STATUS_DOWN_COLOR_SHADES,
  STATUS_OK_COLOR,
  STATUS_OK_COLOR_SHADES,
} from '@/shared/lib/palette';

const DEFAULT_COLOR_SCHEME: ColorScheme = COLOR_SCHEME.AUTO;

const THEME = createTheme({
  fontFamily: FONT_FAMILY_SANS,
  fontFamilyMonospace: FONT_FAMILY_MONOSPACE,
  colors: {
    [PRIMARY_COLOR]: PRIMARY_COLOR_SHADES,
    [RATING_COLOR]: RATING_COLOR_SHADES,
    [STATUS_OK_COLOR]: STATUS_OK_COLOR_SHADES,
    [STATUS_DEGRADED_COLOR]: STATUS_DEGRADED_COLOR_SHADES,
    [STATUS_DOWN_COLOR]: STATUS_DOWN_COLOR_SHADES,
    gray: NEUTRAL_LIGHT_SHADES,
    dark: NEUTRAL_DARK_SHADES,
  },
  primaryColor: PRIMARY_COLOR,
  primaryShade: PRIMARY_SHADE,
  autoContrast: true,
  defaultRadius: 'md',
  components: {
    Avatar: {
      defaultProps: {
        radius: 'md',
      },
    },
    Paper: {
      defaultProps: {
        bg: 'var(--tanuki-color-surface)',
      },
    },
    Badge: {
      defaultProps: {
        radius: 'sm',
      },
    },
  },
});

/**
 * Ключ продублирован в inline-скрипте в `index.html`: он выставляет
 * `data-mantine-color-scheme` до первой отрисовки, иначе у пользователя с тёмной темой
 * успевает моргнуть светлый фон. Меняете здесь — правьте и там.
 */
const COLOR_SCHEME_MANAGER = localStorageColorSchemeManager({ key: 'tanuki-color-scheme' });

type Props = {
  children: ReactNode;
};

function MantineProvider({ children }: Props) {
  return (
    <ExternalMantineProvider
      theme={THEME}
      cssVariablesResolver={CSS_VARIABLES_RESOLVER}
      colorSchemeManager={COLOR_SCHEME_MANAGER}
      defaultColorScheme={DEFAULT_COLOR_SCHEME}
    >
      {children}
    </ExternalMantineProvider>
  );
}

export default MantineProvider;

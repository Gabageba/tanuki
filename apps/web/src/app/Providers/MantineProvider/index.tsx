import type { ReactNode } from 'react';
import type { ComboboxLikeRenderOptionInput, ComboboxItem } from '@mantine/core';
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
} from '../models';
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
import SelectOption from '../../../shared/ui/option/SelectOption';
import styles from './MantineProvider.module.scss';

const DEFAULT_COLOR_SCHEME: ColorScheme = COLOR_SCHEME.AUTO;

const THEME = createTheme({
  fontFamily: FONT_FAMILY_SANS,
  fontFamilyMonospace: FONT_FAMILY_MONOSPACE,
  // `xxs` — промежуточный брейкпоинт между `base` и стандартным `xs` (36em) Mantine.
  breakpoints: {
    xxs: '26em',
  },
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
  cursorType: 'pointer',
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
    Drawer: {
      styles: {
        header: {
          backgroundColor: 'var(--tanuki-color-surface)',
          borderTop: 'var(--mantine-radius-md)',
        },
        title: {
          fontWeight: 600,
        },
        content: {
          borderTopLeftRadius: 'var(--mantine-radius-md)',
          borderTopRightRadius: 'var(--mantine-radius-md)',
          paddingBottom: 'var(--app-shell-footer-height)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        },
        body: {
          display: 'flex',
          flex: 1,
          flexDirection: 'column',
          minHeight: 0,
          overflow: 'hidden',
        },
      },
    },
    EmptyState: {
      defaultProps: {
        title: 'Ничего не найдено',
        description: 'Попробуйте изменить запрос',
      },
    },
    Button: {
      styles: {
        label: {
          fontWeight: 400,
        },
      },
    },
    Card: {
      defaultProps: {
        padding: 'sm',
      },
    },
    Chip: {
      defaultProps: {
        radius: 'md',
        color: PRIMARY_COLOR,
      },
    },
    Pill: {
      defaultProps: {
        radius: 'md',
      },
    },
    SegmentedControl: {
      defaultProps: {
        size: 'md',
      },
      styles: {
        root: {
          height: 36,
          padding: 0,
          border: '1px solid var(--mantine-color-default-border)',
          backgroundColor: 'var(--mantine-color-dark-filled)',
        },
        label: {
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          paddingInline: 10,
        },
        indicator: {
          height: '100%',
          borderRadius: 0,
          backgroundColor: 'var(--mantine-color-default-border)',
        },
        innerLabel: {
          display: 'flex',
        },
      },
    },
    Select: {
      defaultProps: {
        renderOption: (data: ComboboxLikeRenderOptionInput<ComboboxItem>) => (
          <SelectOption {...data} />
        ),
      },
      classNames: {
        option: 'selectableOption',
      },
    },
    Text: {
      defaultProps: {
        fz: 14,
      },
    },
    NavLink: {
      defaultProps: {
        radius: 'md',
      },
      classNames: {
        root: styles.navLink,
      },
      styles: {
        root: {
          borderRadius: 'var(--mantine-radius-md)',
        },
      },
    },
    RangeSlider: {
      defaultProps: {
        size: 'sm',
      },
    },
    Image: {
      defaultProps: {
        radius: 'md',
      },
    },
    Checkbox: {
      classNames: {
        input: styles.checkboxInput,
      },
    },
    Radio: {
      defaultProps: {
        variant: 'outline',
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

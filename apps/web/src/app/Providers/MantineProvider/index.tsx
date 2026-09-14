import type { ReactNode } from 'react';
import { useMemo } from 'react';
import type {
  ComboboxLikeRenderOptionInput,
  ComboboxItem,
  MantineColorSchemeManager,
} from '@mantine/core';
import {
  createTheme,
  defaultVariantColorsResolver,
  MantineProvider as ExternalMantineProvider,
  rem,
} from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
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
import { readSettings, SETTINGS_STORAGE_KEY, writeSettings } from '@/shared/lib/settings';
import SelectOption from '../../../shared/ui/option/SelectOption';
import styles from './MantineProvider.module.scss';

const DEFAULT_COLOR_SCHEME: ColorScheme = COLOR_SCHEME.AUTO;

const createAppTheme = (t: TFunction) =>
  createTheme({
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
    variantColorResolver: (input) =>
      input.variant === 'selectable'
        ? {
            ...defaultVariantColorsResolver({ ...input, variant: 'subtle', color: 'gray' }),
            border: `${rem(1)} solid var(--mantine-color-default)`,
          }
        : defaultVariantColorsResolver(input),
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
        vars: () => ({
          root: {
            '--badge-padding-x-md': '6px',
          },
        }),
      },
      Drawer: {
        classNames: {
          content: styles.drawerContent,
        },
        styles: {
          header: {
            backgroundColor: 'var(--tanuki-color-surface)',
            borderTop: 'var(--mantine-radius-md)',
          },
          title: {
            fontWeight: 600,
          },
          content: {
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
          title: t('nothingFound'),
          description: t('tryChangingQuery'),
        },
      },
      Button: {
        styles: {
          label: {
            fontWeight: 400,
          },
        },
        classNames: {
          root: styles.selectableButton,
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
            backgroundColor: 'var(--mantine-color-default)',
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
 * Схема хранится в том же объекте `settings` в localStorage, что и viewMode каталога
 * (см. `@/shared/lib/settings`). Ключ продублирован в inline-скрипте в `index.html`: он
 * выставляет `data-mantine-color-scheme` до первой отрисовки, иначе у пользователя с тёмной
 * темой успевает моргнуть светлый фон. Меняете ключ или форму settings — правьте и там.
 */
let handleStorageEvent: (event: StorageEvent) => void;

const COLOR_SCHEME_MANAGER: MantineColorSchemeManager = {
  get: (defaultValue) => readSettings().colorScheme ?? defaultValue,
  set: (value) => writeSettings({ colorScheme: value }),
  subscribe: (onUpdate) => {
    handleStorageEvent = (event) => {
      if (event.storageArea !== window.localStorage || event.key !== SETTINGS_STORAGE_KEY) return;
      const next = readSettings().colorScheme;
      if (next) onUpdate(next);
    };
    window.addEventListener('storage', handleStorageEvent);
  },
  unsubscribe: () => window.removeEventListener('storage', handleStorageEvent),
  clear: () => writeSettings({ colorScheme: undefined }),
};

type Props = {
  children: ReactNode;
};

function MantineProvider({ children }: Props) {
  const { t } = useTranslation();
  const theme = useMemo(() => createAppTheme(t), [t]);

  return (
    <ExternalMantineProvider
      theme={theme}
      cssVariablesResolver={CSS_VARIABLES_RESOLVER}
      colorSchemeManager={COLOR_SCHEME_MANAGER}
      defaultColorScheme={DEFAULT_COLOR_SCHEME}
    >
      {children}
    </ExternalMantineProvider>
  );
}

export default MantineProvider;

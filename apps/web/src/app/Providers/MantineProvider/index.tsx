import type { ReactNode } from 'react';
import { useMemo } from 'react';
import type {
  ActionIconProps,
  ComboboxLikeRenderOptionInput,
  ComboboxItem,
  ButtonProps,
  MantineColor,
  MantineColorSchemeManager,
  MantineTheme,
  PillProps,
} from '@mantine/core';
import {
  Alert,
  createTheme,
  defaultVariantColorsResolver,
  MantineProvider as ExternalMantineProvider,
  rem,
} from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { EyeIcon, EyeSlashIcon, LockSimpleIcon } from '@phosphor-icons/react';
import { COLOR_SCHEME, type ColorScheme } from '@tanuki/contracts';
import {
  CSS_VARIABLES_RESOLVER,
  FONT_FAMILY_MONOSPACE,
  FONT_FAMILY_SANS,
  LINE_HEIGHT_TIGHT,
  NEUTRAL_DARK_SHADES,
  NEUTRAL_LIGHT_SHADES,
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
import { XXS_BREAKPOINT } from '@/shared/lib/breakpoints';
import { readSettings, SETTINGS_STORAGE_KEY, writeSettings } from '@/shared/lib/settings';
import SelectOption from '../../../shared/ui/option/SelectOption';
import styles from './MantineProvider.module.scss';

const DEFAULT_COLOR_SCHEME: ColorScheme = COLOR_SCHEME.AUTO;

// Полупрозрачный тон `color` варианта `muted`; `hovered` — тот же тон чуть плотнее, для наведения.
const getMutedVariantBackground = (color: MantineColor, hovered = false) =>
  `color-mix(in srgb, var(--mantine-color-${color}-light) ${hovered ? 70 : 40}%, transparent)`;

const getMutedVariantBorderColor = (color: MantineColor, hovered = false) =>
  `color-mix(in srgb, var(--mantine-color-${color}-filled) ${hovered ? 55 : 35}%, transparent)`;

const createAppTheme = (t: TFunction) =>
  createTheme({
    fontFamily: FONT_FAMILY_SANS,
    fontFamilyMonospace: FONT_FAMILY_MONOSPACE,
    lineHeights: {
      tight: LINE_HEIGHT_TIGHT,
    },
    // `xxs` — промежуточный брейкпоинт между `base` и стандартным `xs` (36em) Mantine.
    breakpoints: {
      xxs: XXS_BREAKPOINT,
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
    variantColorResolver: (input) => {
      switch (input.variant) {
        case 'tile':
          return {
            ...defaultVariantColorsResolver({ ...input, variant: 'subtle', color: 'gray' }),
            border: `${rem(1)} solid var(--mantine-color-default)`,
          };
        // Полупрозрачный тон `color` с обводкой того же цвета — общий для `Button`, `ActionIcon`,
        // `ThemeIcon`, `Alert` и `Badge`. На hover у кнопки чуть плотнее (граница — через `--button-hover-bd`
        // в `Button.vars` и `--ai-hover-bd` в `ActionIcon.vars`).
        case 'muted': {
          const color = input.color || PRIMARY_COLOR;
          return {
            background: getMutedVariantBackground(color),
            hover: getMutedVariantBackground(color, true),
            color: `var(--mantine-color-${color}-light-color)`,
            border: `${rem(1)} solid ${getMutedVariantBorderColor(color)}`,
          };
        }
        default:
          return defaultVariantColorsResolver(input);
      }
    },
    components: {
      // Hover-граница `muted` — так же, как у `Button`: переменную кладут `vars`, применяет её
      // `.actionIcon` в модуле стилей.
      ActionIcon: {
        classNames: {
          root: styles.actionIcon,
        },
        vars: (_theme: MantineTheme, { variant, color = PRIMARY_COLOR }: ActionIconProps) => ({
          root:
            variant === 'muted' ? { '--ai-hover-bd': getMutedVariantBorderColor(color, true) } : {},
        }),
      },
      Alert: Alert.extend({
        classNames: {
          root: styles.alert,
          title: styles.alertTitle,
          message: styles.alertMessage,
        },
      }),
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
          // Карточка в заголовке тянется до крестика и обрезается многоточием, а не выталкивает его.
          title: {
            flex: 1,
            minWidth: 0,
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
      Modal: {
        styles: {
          header: {
            backgroundColor: 'var(--tanuki-color-surface)',
          },
        },
      },
      Button: {
        styles: {
          label: {
            fontWeight: 400,
          },
        },
        classNames: {
          root: styles.button,
        },
        // `variantColorResolver` не умеет в hover-границу, поэтому её для `muted` отдаём
        // переменной, а применяет её `.button` в модуле стилей.
        vars: (_theme: MantineTheme, { variant, color = PRIMARY_COLOR }: ButtonProps) => ({
          root:
            variant === 'muted'
              ? { '--button-hover-bd': getMutedVariantBorderColor(color, true) }
              : {},
        }),
      },
      Card: {
        defaultProps: {
          padding: 'sm',
        },
      },
      // Цвета выбранного `muted` чипа приходят из `variantColorResolver` в `--chip-*`, но своего
      // класса под этот вариант у Mantine нет — применяет их `.chipLabel` в модуле стилей. Там же
      // отступ выбранного чипа без галочки.
      Chip: {
        defaultProps: {
          radius: 'md',
          color: PRIMARY_COLOR,
        },
        classNames: {
          root: styles.chip,
          label: styles.chipLabel,
          iconWrapper: styles.chipIconWrapper,
        },
      },
      // `muted` — тот же тон, что у `Badge`/`Button`: у Pill нет `color` и `variantColorResolver`,
      // поэтому цвета задаются стилями и всегда акцентные.
      Pill: {
        defaultProps: {
          radius: 'md',
        },
        styles: (_theme: MantineTheme, { variant }: PillProps) =>
          variant === 'muted'
            ? {
                root: {
                  backgroundColor: getMutedVariantBackground(PRIMARY_COLOR),
                  color: `var(--mantine-color-${PRIMARY_COLOR}-light-color)`,
                  border: `${rem(1)} solid ${getMutedVariantBorderColor(PRIMARY_COLOR)}`,
                },
              }
            : {},
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
      // Тот же вид пунктов, что у Select: галочка справа и подсветка выбранных.
      MultiSelect: {
        defaultProps: {
          renderOption: (data: ComboboxLikeRenderOptionInput<ComboboxItem>) => (
            <SelectOption {...data} />
          ),
        },
        classNames: {
          option: 'selectable-option',
        },
      },
      Select: {
        defaultProps: {
          renderOption: (data: ComboboxLikeRenderOptionInput<ComboboxItem>) => (
            <SelectOption {...data} />
          ),
        },
        classNames: {
          option: 'selectable-option',
        },
      },
      Text: {
        classNames: {
          root: styles.text,
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
      RadioCard: {
        classNames: {
          card: styles.radioCard,
        },
      },
      Tabs: {
        classNames: {
          tab: styles.tabsTab,
        },
      },
      PasswordInput: {
        defaultProps: {
          leftSection: <LockSimpleIcon />,
          visibilityToggleIcon: ({ reveal }: { reveal: boolean }) =>
            reveal ? <EyeSlashIcon size={16} /> : <EyeIcon size={16} />,
        },
        styles: {
          visibilityToggle: {
            borderRadius: 'var(--mantine-radius-md)',
            color: 'var(--mantine-color-dimmed)',
          },
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

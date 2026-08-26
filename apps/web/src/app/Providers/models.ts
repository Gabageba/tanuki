import type { CSSVariablesResolver, MantineColorScheme, MantineColorsTuple } from '@mantine/core';
import type { EnumLiteralsOf } from '@tanuki/contracts';

/**
 * Два шрифта под весь интерфейс (см. `CLAUDE.md` → «Типографика»): Golos Text — весь текст без
 * исключений, JetBrains Mono — всё, что читается как данные, а не как речь. Unbounded — только
 * лого, единственная точка использования — `--tanuki-font-brand`.
 */
export const FONT_FAMILY_SANS = 'Golos Text, sans-serif';
const FONT_FAMILY_BRAND = 'Unbounded, sans-serif';
export const FONT_FAMILY_MONOSPACE = 'JetBrains Mono, ui-monospace, SFMono-Regular, monospace';

export const COLOR_SCHEME = {
  LIGHT: 'light',
  DARK: 'dark',
  AUTO: 'auto',
} as const satisfies Record<string, MantineColorScheme>;
export type ColorScheme = EnumLiteralsOf<typeof COLOR_SCHEME>;

export const getColorSchemeLabel = (colorScheme: ColorScheme) => {
  switch (colorScheme) {
    case COLOR_SCHEME.LIGHT:
      return 'Светлая';
    case COLOR_SCHEME.DARK:
      return 'Тёмная';
    case COLOR_SCHEME.AUTO:
      return 'Системная';
  }
};

/**
 * Нейтрали светлой темы. Шаги подобраны так, чтобы стандартные роли Mantine попали в цвета
 * макета без переопределения: `gray-0` — фон страницы и hover, `gray-5` — placeholder,
 * `gray-6` — приглушённый текст.
 */
export const NEUTRAL_LIGHT_SHADES: MantineColorsTuple = [
  '#f6f7f9',
  '#f1f3f6',
  '#e8ebef',
  '#dfe3e8',
  '#c9cfd7',
  '#9aa2ac',
  '#767e88',
  '#5d656f',
  '#4b525b',
  '#2f353d',
];

/**
 * Нейтрали тёмной темы. Как и у Mantine, шкала несимметрична: 0–3 — тона текста, 4–9 — обводки
 * и подложки. Совпадает с ролями Mantine один в один: `dark-4` — обводка инпута, `dark-6` — его
 * фон, `dark-7` — фон страницы.
 */
export const NEUTRAL_DARK_SHADES: MantineColorsTuple = [
  '#e7eaee',
  '#cfd5dc',
  '#9aa3ad',
  '#6b7280',
  '#262b32',
  '#1c2026',
  '#16191d',
  '#101215',
  '#0c0e10',
  '#08090b',
];

/**
 * Роли, которых нет в Mantine: карточка отделена от фона страницы, шапка — от карточки, а у
 * обводок три ступени (разделитель / рамка / рамка активного элемента).
 */
export const CSS_VARIABLES_RESOLVER: CSSVariablesResolver = () => ({
  variables: {
    // Не завязана на схему — нужна как строковая CSS-переменная для точечного `ff` на лого,
    // единственном месте с Unbounded, тогда как `fontFamily`/`fontFamilyMonospace` темы уже
    // покрывают Golos Text и JetBrains Mono через стандартные `--mantine-font-family*`.
    '--tanuki-font-brand': FONT_FAMILY_BRAND,
  },
  light: {
    // В Mantine `--mantine-color-text` в светлой теме зашит как `#000`, а фон — как `#fff`.
    '--mantine-color-text': '#16181c',
    '--mantine-color-body': '#f6f7f9',
    '--mantine-color-default-border': '#dfe3e8',
    // Рыжий в роли чернил меряется контрастом против фона страницы, а не против текста на себе,
    // поэтому в светлой теме он берётся с тёмного конца шкалы (shade 9, 4.9:1 против `body`), а в
    // тёмной — со светлого (shade 4). Брендовый `-filled` при этом один и тот же в обеих схемах:
    // его контраст считается против собственного текста, и фон страницы в нём не участвует.
    '--mantine-color-anchor': '#ae4f3a',

    '--tanuki-color-surface': '#ffffff',
    '--tanuki-color-header': '#ffffff',
    '--tanuki-color-subtle': '#f1f3f6',
    '--tanuki-color-hover': '#e6e9ee',
    '--tanuki-color-monogram': '#e6e9ee',

    '--tanuki-color-border-subtle': '#e3e6ea',
    '--tanuki-color-border-strong': '#d7dce2',

    '--tanuki-color-text-bright': '#16181c',
    '--tanuki-color-text-secondary': '#4b525b',
    '--tanuki-color-text-faint': '#c9cfd7',

    '--tanuki-color-rating': '#a2822a',
    '--tanuki-color-status-ok': '#369e5c',
    '--tanuki-color-status-degraded': '#a37312',
    '--tanuki-color-status-down': '#c34652',
  },
  dark: {
    '--mantine-color-anchor': '#fa9a84',

    '--tanuki-color-surface': '#14171b',
    '--tanuki-color-header': '#0c0e10',
    '--tanuki-color-subtle': '#191d22',
    '--tanuki-color-hover': '#171b20',
    '--tanuki-color-monogram': '#2a2f36',

    '--tanuki-color-border-subtle': '#1c2026',
    '--tanuki-color-border-strong': '#262b32',

    '--tanuki-color-text-bright': '#f2f4f6',
    '--tanuki-color-text-secondary': '#cfd5dc',
    '--tanuki-color-text-faint': '#4d565f',

    '--tanuki-color-rating': '#dac593',
    '--tanuki-color-status-ok': '#48de81',
    '--tanuki-color-status-degraded': '#e2a73d',
    '--tanuki-color-status-down': '#ee6c75',
  },
});

import { COLOR_SCHEME, type ColorScheme } from '@tanuki/contracts';

export const getSchemeLabel = (scheme: ColorScheme) => {
  switch (scheme) {
    case COLOR_SCHEME.LIGHT:
      return 'Светлая';
    case COLOR_SCHEME.DARK:
      return 'Тёмная';
    case COLOR_SCHEME.AUTO:
      return 'Системная';
  }
};

export const getSchemeHint = (scheme: ColorScheme) => {
  switch (scheme) {
    case COLOR_SCHEME.LIGHT:
      return 'днём, при ярком свете';
    case COLOR_SCHEME.DARK:
      return 'по умолчанию в Tanuki';
    case COLOR_SCHEME.AUTO:
      return 'следует за настройкой ОС';
  }
};

/** Рамка выбранного варианта — акцентная, у остальных — обычная. */
export const getSelectionBorderColor = (selected: boolean) =>
  selected ? 'var(--mantine-primary-color-filled)' : 'var(--mantine-color-default-border)';

import type { TFunction } from 'i18next';
import { COLOR_SCHEME, type ColorScheme } from '@tanuki/contracts';

export const getColorSchemeHint = (colorScheme: ColorScheme, t: TFunction) => {
  switch (colorScheme) {
    case COLOR_SCHEME.LIGHT:
      return t('daytimeInBrightLight');
    case COLOR_SCHEME.DARK:
      return t('eveningInDimLight');
    case COLOR_SCHEME.AUTO:
      return t('followsOsSetting');
  }
};

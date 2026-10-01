import type { TFunction } from 'i18next';

/** Подпись тумблера тайтлов 18+ на обычных источниках — при всём контенте 18+ он заблокирован. */
export const getAdultTitlesDescription = (
  showAdultSources: boolean,
  hideAdultTitles: boolean,
  t: TFunction,
) => {
  if (showAdultSources) return t('enabledTogetherWithAdultContent');
  if (hideAdultTitles) return t('coversBlurredPagesDontOpen');
  return t('shownAsUsual');
};

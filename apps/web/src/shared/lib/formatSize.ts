import type { TFunction } from 'i18next';

const BYTES_IN_MB = 1024 * 1024;
const BYTES_IN_GB = 1024 * BYTES_IN_MB;

/** «1,8 ГБ», «340 МБ» — объём скачанного и места в хранилище браузера. */
export const formatSize = (bytes: number, t: TFunction, language: string) => {
  const format = (value: number) =>
    new Intl.NumberFormat(language, { maximumFractionDigits: 1 }).format(value);

  return bytes >= BYTES_IN_GB
    ? t('sizeGb', { size: format(bytes / BYTES_IN_GB) })
    : t('sizeMb', { size: format(bytes / BYTES_IN_MB) });
};

import type { TFunction } from 'i18next';
import type { ReaderPreset, ReaderRange } from './models';

export const getReaderPresets = (range: ReaderRange, t: TFunction): ReaderPreset[] => [
  { label: t('narrow'), value: range.NARROW },
  { label: t('medium'), value: range.MEDIUM },
  { label: t('wide'), value: range.WIDE },
];

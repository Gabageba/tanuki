import type { ReactNode } from 'react';
import type { TFunction } from 'i18next';
import type { ReaderPreset, ReaderRange } from './models';

export const getReaderPresets = (
  range: ReaderRange & { NARROW: number; MEDIUM: number; WIDE: number },
  t: TFunction,
): ReaderPreset[] => [
  { label: t('narrow'), value: range.NARROW },
  { label: t('medium'), value: range.MEDIUM },
  { label: t('wide'), value: range.WIDE },
];

export const getReaderSelectOptions = (
  items: { id: string; title: string; description: string; icon: ReactNode }[],
) => items.map(({ id, title, ...rest }) => ({ value: id, label: title, ...rest }));

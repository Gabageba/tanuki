import type { ReactNode } from 'react';
import type useTitleDetails from '@/entities/title/hooks/useTitleDetails';

export type TitleDetailsQuery = ReturnType<typeof useTitleDetails>;

export type TitleInfoItem = {
  label: string;
  value: ReactNode | undefined;
  /** Значение читается как показание, а не как речь: счётчик, оценка, год. */
  isNumeric?: boolean;
};

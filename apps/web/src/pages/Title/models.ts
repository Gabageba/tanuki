import type { ReactNode } from 'react';
import type useTitleDetails from './hooks/useTitleDetails';

export type TitleDetailsQuery = ReturnType<typeof useTitleDetails>;

export type TitleInfoItem = {
  label: string;
  value: ReactNode | undefined;
};

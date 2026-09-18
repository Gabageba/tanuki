import type { ReactNode } from 'react';
import type useMangaDetails from './hooks/useMangaDetails';

export type MangaDetailsQuery = ReturnType<typeof useMangaDetails>;

export type MangaInfoItem = {
  label: string;
  value: ReactNode | undefined;
};

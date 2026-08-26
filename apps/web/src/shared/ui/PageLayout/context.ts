import { createContext } from 'react';
import type { PageLayoutBaseQuery } from './models';

export const PageLayoutQueryContext = createContext<PageLayoutBaseQuery | null>(null);

export type PageLayoutParamsState = {
  params: unknown;
  setParams: (params: unknown) => void;
};

export const PageLayoutParamsContext = createContext<PageLayoutParamsState | null>(null);

import { createContext } from 'react';
import type { PageLayoutBaseQuery, PageLayoutQueries } from './models';

export const PageLayoutQueryContext = createContext<PageLayoutBaseQuery | null>(null);

export const PageLayoutQueriesContext = createContext<PageLayoutQueries | null>(null);

/** Загрузка и ошибка страницы для Content: главный запрос или все именованные сразу. */
export const PageLayoutStatusContext = createContext<PageLayoutBaseQuery | null>(null);

export type PageLayoutParamsState = {
  params: unknown;
  setParams: (params: unknown) => void;
};

export const PageLayoutParamsContext = createContext<PageLayoutParamsState | null>(null);

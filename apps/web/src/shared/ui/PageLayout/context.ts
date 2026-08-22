import { createContext } from 'react';
import type { PageLayoutBaseQuery } from './models';

export const PageLayoutQueryContext = createContext<PageLayoutBaseQuery | null>(null);

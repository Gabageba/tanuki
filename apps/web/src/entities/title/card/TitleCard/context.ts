import { createContext } from 'react';
import type { TitleCardLayout } from './models';

export const TitleCardLayoutContext = createContext<TitleCardLayout | null>(null);

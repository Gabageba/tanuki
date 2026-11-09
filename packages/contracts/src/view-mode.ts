import { z } from 'zod';
import type { EnumLiteralsOf } from './utils';

export const VIEW_MODE = {
  GRID: 'grid',
  LIST: 'list',
  COVERLESS: 'coverless',
} as const;
export type ViewMode = EnumLiteralsOf<typeof VIEW_MODE>;
export const ViewModeSchema = z.enum(VIEW_MODE);

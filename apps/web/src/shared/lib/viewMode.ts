import { type EnumLiteralsOf } from '@tanuki/contracts';
import { readSettings, writeSettings } from './settings';

export const VIEW_MODE = {
  GRID: 'grid',
  LIST: 'list',
} as const;
export type ViewMode = EnumLiteralsOf<typeof VIEW_MODE>;

export const getStoredViewMode = (): ViewMode | undefined => readSettings().viewMode;

export const setStoredViewMode = (viewMode: ViewMode) => writeSettings({ viewMode });

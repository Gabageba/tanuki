import { VIEW_MODE, type ViewMode } from '@tanuki/contracts';
import { readSettings, writeSettings } from './settings';

export { VIEW_MODE, type ViewMode };

export const getStoredViewMode = (): ViewMode | undefined => readSettings().viewMode;

export const setStoredViewMode = (viewMode: ViewMode) => writeSettings({ viewMode });

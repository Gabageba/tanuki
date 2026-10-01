import {
  DEFAULT_READER_SETTINGS,
  READER_READING_MODE,
  type ReaderReadingMode,
  type ReaderSettings,
} from '@tanuki/contracts';
import { CUSTOM_CONTAINER_WIDTH } from './models';

export const getMockSettings = (readingMode: ReaderReadingMode): ReaderSettings => ({
  ...DEFAULT_READER_SETTINGS,
  readingMode,
});

/** Для оси S: ширина контейнера не совпадает ни с одним пресетом. */
export const getMockSettingsWithCustomWidth = (readingMode: ReaderReadingMode): ReaderSettings => ({
  ...getMockSettings(readingMode),
  containerWidth: CUSTOM_CONTAINER_WIDTH,
});

export const DEFAULT_MOCK_MODE = READER_READING_MODE.VERTICAL;

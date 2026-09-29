import type { QueryClient } from '@tanstack/react-query';
import type { TFunction } from 'i18next';
import { SETTINGS_STORAGE_KEY } from '@/shared/lib/settings';
import { EXPORT_FORMAT, MOCK_BOOKMARK_STATUS, OFFLINE_CACHE_NAME } from './models';
import type { ExportFormat, MockBookmarkStatus } from './models';

/**
 * Сбрасывает всё, что приложение накопило в браузере, кроме входа и настроек: сессия живёт в
 * httpOnly cookie и сюда не попадает, настройки (тема, язык, вид каталога) остаются в localStorage.
 * После сброса страница перезагружается, чтобы ни один компонент не держал старые данные в памяти.
 */
export const clearBrowserCache = async (queryClient: QueryClient) => {
  queryClient.clear();

  try {
    window.sessionStorage.clear();
    Object.keys(window.localStorage)
      .filter((key) => key !== SETTINGS_STORAGE_KEY)
      .forEach((key) => window.localStorage.removeItem(key));
  } catch {
    // Хранилище может быть недоступно (приватный режим) — тогда и чистить нечего.
  }

  if ('caches' in window) {
    const names = await window.caches.keys();
    await Promise.all(
      names.filter((name) => name !== OFFLINE_CACHE_NAME).map((name) => window.caches.delete(name)),
    );
  }

  window.location.reload();
};

export const getExportFormatLabel = (format: ExportFormat) => {
  switch (format) {
    case EXPORT_FORMAT.JSON:
      return 'JSON';
    case EXPORT_FORMAT.CSV:
      return 'CSV';
  }
};

export const getMockBookmarkStatusLabel = (status: MockBookmarkStatus, t: TFunction) => {
  switch (status) {
    case MOCK_BOOKMARK_STATUS.READING:
      return t('reading');
    case MOCK_BOOKMARK_STATUS.PLANNED:
      return t('planned');
    case MOCK_BOOKMARK_STATUS.COMPLETED:
      return t('completed');
    case MOCK_BOOKMARK_STATUS.DROPPED:
      return t('dropped');
  }
};

const BYTES_IN_MB = 1024 * 1024;
const BYTES_IN_GB = 1024 * BYTES_IN_MB;

/** «1,8 ГБ», «340 МБ» — занятое место в хранилище браузера. */
export const getStorageSizeLabel = (bytes: number, t: TFunction, language: string) => {
  const format = (value: number) =>
    new Intl.NumberFormat(language, { maximumFractionDigits: 1 }).format(value);

  return bytes >= BYTES_IN_GB
    ? t('sizeGb', { size: format(bytes / BYTES_IN_GB) })
    : t('sizeMb', { size: format(bytes / BYTES_IN_MB) });
};

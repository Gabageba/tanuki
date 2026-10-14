import type { QueryClient } from '@tanstack/react-query';
import type { TFunction } from 'i18next';
import { SETTINGS_STORAGE_KEY } from '@/shared/lib/settings';
import { OFFLINE_CACHE_NAME } from '@/entities/download/models';
import { LAST_USER_STORAGE_KEY } from '@/entities/user/lastUser';
import { EXPORT_FORMAT } from './models';
import type { ExportFormat } from './models';

/** Что «Очистить кеш браузера» оставляет в localStorage: настройки и вход без сети. */
const KEPT_STORAGE_KEYS = [SETTINGS_STORAGE_KEY, LAST_USER_STORAGE_KEY];

/** Precache app shell — без него приложение не откроется без сети до следующего обновления. */
const isPrecacheName = (name: string) => name.startsWith('workbox-precache');

/**
 * Сбрасывает всё, что приложение накопило в браузере, кроме входа, настроек и скачанного: сессия
 * живёт в httpOnly cookie и сюда не попадает, настройки (тема, язык, вид каталога) и последний
 * вошедший остаются в localStorage, скачанные главы — в своём кеше и базе.
 * После сброса страница перезагружается, чтобы ни один компонент не держал старые данные в памяти.
 */
export const clearBrowserCache = async (queryClient: QueryClient) => {
  queryClient.clear();

  try {
    window.sessionStorage.clear();
    Object.keys(window.localStorage)
      .filter((key) => !KEPT_STORAGE_KEYS.includes(key))
      .forEach((key) => window.localStorage.removeItem(key));
  } catch {
    // Хранилище может быть недоступно (приватный режим) — тогда и чистить нечего.
  }

  if ('caches' in window) {
    const names = await window.caches.keys();
    await Promise.all(
      names
        .filter((name) => name !== OFFLINE_CACHE_NAME && !isPrecacheName(name))
        .map((name) => window.caches.delete(name)),
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

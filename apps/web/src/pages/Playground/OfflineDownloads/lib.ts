import { getMutedBackground, getMutedBorderColor, PRIMARY_COLOR } from '@/shared/lib/palette';
import { BRANCH_DOWNLOADED, BRANCH_QUEUED, BRANCH_READ_UP_TO, BRANCH_TOTAL } from './mocks';
import {
  DOWNLOAD_ERROR,
  DOWNLOAD_SCOPE,
  DOWNLOAD_STATUS,
  OFFLINE_SIGNAL,
  PLATE_STATE,
  UNAVAILABLE_PLACE,
  type DownloadError,
  type DownloadStatus,
  type OfflineSignal,
  type DownloadFormValues,
  type DownloadScope,
  type MockChapter,
  type PlateState,
  type UnavailablePlace,
} from './models';

/** «24 МБ», «1,8 ГБ» — объём моноширинным, с неразрывным пробелом. */
export const formatSize = (megabytes: number) => {
  if (megabytes < 1000) return `${Math.round(megabytes)}\u00a0МБ`;
  return `${(megabytes / 1000).toFixed(1).replace('.', ',')}\u00a0ГБ`;
};

/** «1 гл.» — сокращение не склоняется, плюрал не нужен. */
export const formatChaptersCount = (count: number) => `${count}\u00a0гл.`;

export const formatChapterNumber = (chapter: MockChapter) => `Гл.\u00a0${chapter.number}`;

/** «01.02.2026» — числовая дата списка глав. */
export const formatDateNumeric = (date: string) => {
  const [year, month, day] = date.split('-');
  return `${day}.${month}.${year}`;
};

export const getChaptersSize = (chapters: MockChapter[]) =>
  chapters.reduce((sum, chapter) => sum + chapter.sizeMb, 0);

export const getDownloadErrorLabel = (error: DownloadError) => {
  switch (error) {
    case DOWNLOAD_ERROR.NETWORK:
      return 'Не удалось скачать: сеть обрывалась';
    case DOWNLOAD_ERROR.SOURCE:
      return 'Источник не отдал страницы';
    case DOWNLOAD_ERROR.QUOTA:
      return 'Кончилось место на устройстве';
  }
};

/** Плашка тайтла: фраза по состоянию его загрузок. Объём идёт отдельным моноширинным значением. */
export const getPlatePhrase = (state: PlateState) => {
  switch (state) {
    case PLATE_STATE.DONE:
      return 'Скачано 12 гл.';
    case PLATE_STATE.DOWNLOADING:
      return 'Скачивается 3 из 12';
    case PLATE_STATE.PAUSED:
      return 'Загрузки приостановлены, 3 из 12';
    case PLATE_STATE.FAILED:
      return 'Не скачались 2 гл.';
  }
};

export const getPlateSize = (state: PlateState) => {
  switch (state) {
    case PLATE_STATE.DONE:
      return formatSize(340);
    case PLATE_STATE.DOWNLOADING:
    case PLATE_STATE.PAUSED:
      return formatSize(72);
    case PLATE_STATE.FAILED:
      return formatSize(240);
  }
};

export const getPlateStateLabel = (state: PlateState) => {
  switch (state) {
    case PLATE_STATE.DONE:
      return 'Всё скачано';
    case PLATE_STATE.DOWNLOADING:
      return 'Качается';
    case PLATE_STATE.PAUSED:
      return 'Пауза';
    case PLATE_STATE.FAILED:
      return 'Ошибка';
  }
};

/** Доля скачанного у плашки: 3 из 12. */
export const PLATE_PROGRESS = 25;

/** Сколько глав встанет в очередь: уже скачанные (1–12) и стоящие в очереди (13–15) не считаются. */
export const countChaptersToDownload = (values: DownloadFormValues) => {
  const taken = BRANCH_DOWNLOADED + BRANCH_QUEUED;
  switch (values.scope) {
    case DOWNLOAD_SCOPE.ALL:
      return BRANCH_TOTAL - taken;
    case DOWNLOAD_SCOPE.UNREAD:
      return BRANCH_TOTAL - BRANCH_READ_UP_TO;
    case DOWNLOAD_SCOPE.RANGE: {
      const from = Number(values.from);
      const to = Number(values.to);
      if (!from || !to || from > to) return 0;
      const overlap = Math.max(0, Math.min(to, taken) - from + 1);
      return to - from + 1 - overlap;
    }
  }
};

export const getScopeLabel = (scope: DownloadScope) => {
  switch (scope) {
    case DOWNLOAD_SCOPE.ALL:
      return 'Все главы';
    case DOWNLOAD_SCOPE.UNREAD:
      return 'Непрочитанные';
    case DOWNLOAD_SCOPE.RANGE:
      return 'Диапазон';
  }
};

export const getUnavailableTitle = (place: UnavailablePlace) => {
  switch (place) {
    case UNAVAILABLE_PLACE.TITLE:
      return 'Нет сети';
    case UNAVAILABLE_PLACE.CHAPTER:
      return 'Глава не скачана';
  }
};

export const getUnavailableReason = (place: UnavailablePlace) => {
  switch (place) {
    case UNAVAILABLE_PLACE.TITLE:
      return 'Этот тайтл не сохранён на устройстве';
    case UNAVAILABLE_PLACE.CHAPTER:
      return 'Без сети открываются только скачанные главы';
  }
};

/** Цвет состояния главы для подвариантов C2: качается — акцент, скачана — teal, ошибка — красный.
 *  В очереди и не скачана — без цвета. */
export const getDownloadStatusColor = (status: DownloadStatus | null) => {
  switch (status) {
    case DOWNLOAD_STATUS.DOWNLOADING:
      return PRIMARY_COLOR;
    case DOWNLOAD_STATUS.DONE:
      return 'teal';
    case DOWNLOAD_STATUS.FAILED:
      return 'red';
    case DOWNLOAD_STATUS.QUEUED:
    case null:
      return null;
  }
};

/** Состояние плашки тайтла по его главам; ничего не скачано и не в очереди — плашки нет. */
export const getPlateStateFromChapters = (chapters: MockChapter[]): PlateState | null => {
  const statuses = chapters.map((chapter) => chapter.status);
  if (statuses.includes(DOWNLOAD_STATUS.DOWNLOADING) || statuses.includes(DOWNLOAD_STATUS.QUEUED)) {
    return PLATE_STATE.DOWNLOADING;
  }
  if (statuses.includes(DOWNLOAD_STATUS.FAILED)) return PLATE_STATE.FAILED;
  if (statuses.includes(DOWNLOAD_STATUS.DONE)) return PLATE_STATE.DONE;
  return null;
};

/** Акцентный тон полосы N9c и её подвариантов: фон и рамка. */
export const ACCENT_TAB_BACKGROUND = getMutedBackground(PRIMARY_COLOR, true);
export const ACCENT_TAB_BORDER = getMutedBorderColor(PRIMARY_COLOR, true);

/** Линия под шапкой без сети: N9c1 и N9c4 её убирают, N9c3 красит в цвет рамки полосы. */
export const getHeaderBorder = (signal: OfflineSignal) => {
  switch (signal) {
    case OFFLINE_SIGNAL.TAB_ACCENT_NO_LINE:
    case OFFLINE_SIGNAL.TAB_ACCENT_HEADER:
      return 'none';
    case OFFLINE_SIGNAL.TAB_ACCENT_LINE:
      return `1px solid ${ACCENT_TAB_BORDER}`;
    case OFFLINE_SIGNAL.ICON:
    case OFFLINE_SIGNAL.STRIP:
    case OFFLINE_SIGNAL.TOAST:
    case OFFLINE_SIGNAL.MUTED_HEADER:
    case OFFLINE_SIGNAL.STRIP_STRONG:
    case OFFLINE_SIGNAL.STRIP_NEUTRAL:
    case OFFLINE_SIGNAL.CAPSULE:
    case OFFLINE_SIGNAL.HEADER_BADGE:
    case OFFLINE_SIGNAL.TAB_GOLD:
    case OFFLINE_SIGNAL.TAB_INVERTED:
    case OFFLINE_SIGNAL.TAB_ACCENT:
    case OFFLINE_SIGNAL.TAB_CENTER:
    case OFFLINE_SIGNAL.TAB_ACCENT_FILL:
    case OFFLINE_SIGNAL.SEARCH:
    case OFFLINE_SIGNAL.DOWNLOADS_BUTTON:
    case OFFLINE_SIGNAL.SNACKBAR:
    case OFFLINE_SIGNAL.AVATAR_STATUS:
    case OFFLINE_SIGNAL.STRIP_HEADER:
    case OFFLINE_SIGNAL.STRIP_BUTTON:
    case OFFLINE_SIGNAL.STRIP_LINK_GOLD:
    case OFFLINE_SIGNAL.STRIP_LINK_ACCENT:
    case OFFLINE_SIGNAL.STRIP_LINK_TEXT:
      return '1px solid var(--mantine-color-default-border)';
  }
};

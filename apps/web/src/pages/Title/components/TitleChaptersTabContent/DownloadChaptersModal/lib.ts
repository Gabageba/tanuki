import type { TFunction } from 'i18next';
import type { Chapter } from '@tanuki/contracts';
import type { DownloadRow } from '@/entities/download/models';
import {
  DOWNLOAD_SCOPE,
  FALLBACK_CHAPTER_BYTES,
  type DownloadChaptersFormValues,
  type DownloadScope,
} from './models';

type SelectParams = {
  values: DownloadChaptersFormValues;
  /** Главы ветки в порядке чтения — от старых к новым. */
  chapters: Chapter[];
  /** Своя отметка в этой ветке — глава, которую читают сейчас; с неё и дальше — непрочитанное. */
  ownChapterId: string | undefined;
  downloads: ReadonlyMap<string, DownloadRow> | undefined;
};

export const isInRange = (chapter: Chapter, from: number, to: number) =>
  chapter.number !== null && chapter.number >= from && chapter.number <= to;

/** Главы, которые встанут в очередь: уже скачанные и стоящие в очереди не считаются. */
export const selectChaptersToDownload = ({
  values,
  chapters,
  ownChapterId,
  downloads,
}: SelectParams) => {
  const fresh = chapters.filter((chapter) => !downloads?.has(chapter.id));
  switch (values.scope) {
    case DOWNLOAD_SCOPE.ALL:
      return fresh;
    case DOWNLOAD_SCOPE.UNREAD: {
      const ownIndex = chapters.findIndex((chapter) => chapter.id === ownChapterId);
      // Глава с отметкой не дочитана: в отметке хранится страница, с которой её продолжат.
      const unread = ownIndex === -1 ? chapters : chapters.slice(ownIndex);
      const unreadIds = new Set(unread.map((chapter) => chapter.id));
      return fresh.filter((chapter) => unreadIds.has(chapter.id));
    }
    case DOWNLOAD_SCOPE.RANGE: {
      const { from, to } = values;
      if (from === '' || to === '' || from > to) return [];
      return fresh.filter((chapter) => isInRange(chapter, from, to));
    }
  }
};

export const getDownloadScopeLabel = (scope: DownloadScope, t: TFunction) => {
  switch (scope) {
    case DOWNLOAD_SCOPE.ALL:
      return t('allChapters');
    case DOWNLOAD_SCOPE.UNREAD:
      return t('unread');
    case DOWNLOAD_SCOPE.RANGE:
      return t('range');
  }
};

/** Размер главы заранее не узнать — берём средний по уже скачанным. */
export const getAverageChapterBytes = (total: { count: number; bytes: number } | undefined) =>
  total && total.count > 0 ? total.bytes / total.count : FALLBACK_CHAPTER_BYTES;

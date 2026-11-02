import { http, HttpResponse } from 'msw';
import {
  DEFAULT_READER_SETTINGS,
  type ReaderSettings,
  type PagesResponse,
} from '@tanuki/contracts';
import { apiPath } from './handlers';
import { getPagesResponse, READING_CHAPTER } from './titles';
import { TITLE_DOWNLOADED_SEED } from './downloads';
import type { OfflineDbSeed } from './models';
import { getPageUrl, PAGE_SIZE } from './images';

export const getReaderSettingsHandler = (patch: Partial<ReaderSettings>) =>
  http.get(apiPath('/reader-settings'), () =>
    HttpResponse.json({ ...DEFAULT_READER_SETTINGS, ...patch }),
  );

export const getReaderPagesHandler = (count: number, unknownSizes = false, mixedSizes = false) =>
  http.get(apiPath('/titles/:titleId/chapters/:chapterId/pages'), ({ params }) => {
    const chapterId = String(params['chapterId']);
    return HttpResponse.json({
      ...getPagesResponse(chapterId),
      items: Array.from({ length: count }, (_, index) => ({
        index,
        url: `${getPageUrl(chapterId, index)}${mixedSizes && index % 2 === 1 ? '&short=1' : ''}`,
        width: unknownSizes ? null : PAGE_SIZE.width,
        height: unknownSizes ? null : mixedSizes && index % 2 === 1 ? 900 : PAGE_SIZE.height,
      })),
    } satisfies PagesResponse);
  });

const OFFLINE_CHAPTER = getPagesResponse(READING_CHAPTER.id);
export const READER_OFFLINE_SEED: OfflineDbSeed = {
  ...TITLE_DOWNLOADED_SEED,
  downloads: [
    {
      ...TITLE_DOWNLOADED_SEED.downloads[0]!,
      chapterId: READING_CHAPTER.id,
      pagesDone: OFFLINE_CHAPTER.items.length,
      pagesTotal: OFFLINE_CHAPTER.items.length,
    },
  ],
  chapters: [
    {
      ...TITLE_DOWNLOADED_SEED.chapters[0]!,
      chapterId: READING_CHAPTER.id,
      chapter: READING_CHAPTER,
      pages: OFFLINE_CHAPTER.items,
      prevChapterId: OFFLINE_CHAPTER.prevChapterId,
      nextChapterId: OFFLINE_CHAPTER.nextChapterId,
    },
  ],
};

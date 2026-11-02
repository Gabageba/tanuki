import { READER_PAGE_LAYOUT, READER_READING_MODE, type ReaderSettings } from '@tanuki/contracts';
import type { ReaderFeedChapter, ReaderPosition } from './models';

export const getReaderPageStep = (settings: ReaderSettings) =>
  settings.readingMode === READER_READING_MODE.HORIZONTAL &&
  settings.pageLayout === READER_PAGE_LAYOUT.SPREAD
    ? 2
    : 1;

export const getSpreadStart = (index: number, step: number) =>
  Math.floor(Math.max(0, index) / step) * step;

export const getVisiblePageEnd = (index: number, length: number, step: number) =>
  Math.min(length - 1, getSpreadStart(index, step) + step - 1);

/** Count pages, rather than chapters or spreads, across the loaded feed. */
export const getFollowingPages = (
  chapters: ReaderFeedChapter[],
  position: ReaderPosition,
  count: number,
) => {
  const chapterIndex = chapters.findIndex((chapter) => chapter.chapterId === position.chapterId);
  if (chapterIndex < 0) return [];
  return chapters
    .slice(chapterIndex)
    .flatMap((chapter, index) =>
      chapter.pages
        .filter((page) => index > 0 || page.index > position.pageIndex)
        .map((page) => ({ chapterId: chapter.chapterId, page })),
    )
    .slice(0, count);
};

export const isReaderInteractionBlocked = (event: KeyboardEvent | PointerEvent | MouseEvent) => {
  if (
    event.target instanceof Element &&
    event.target.closest(
      'input, textarea, select, button, a, [contenteditable="true"], [role="button"], [role="slider"], [role="combobox"]',
    )
  )
    return true;
  return Boolean(document.querySelector('[role="dialog"], [role="menu"], [data-reader-overlay]'));
};

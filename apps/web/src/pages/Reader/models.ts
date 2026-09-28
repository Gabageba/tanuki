import type { Page } from '@tanuki/contracts';

/**
 * Место, на котором читатель остановился. Состояние одно на оба режима: вертикальный пишет его
 * скроллом, горизонтальный — кликами и стрелками, поэтому переключение режима ничего не теряет.
 */
export type ReaderPosition = {
  chapterId: string;
  pageIndex: number;
};

/** Глава в ленте — ответ /pages, разложенный так, чтобы компонентам не приходилось разбираться в
 *  состоянии запроса. */
export type ReaderFeedChapter = {
  chapterId: string;
  pages: Page[];
  prevChapterId: string | null;
  nextChapterId: string | null;
  isPending: boolean;
  isError: boolean;
  error: Error | null;
  /** Повторный запрос главы. Нужен там, где уйти с неупавшей главы некому: в горизонтальном режиме
   *  она занимает весь экран, а адрес уже показывает её. */
  refetch: () => void;
};

import { useEffect, useState } from 'react';
import { CHAPTER_ACTION, DOWNLOAD_STATUS, type ChapterAction, type MockChapter } from '../models';

const TICK_MS = 350;

/** Живой список глав: ↓ ставит главу в очередь, одна глава качается за раз, отмена и удаление
 *  стирают запись, повтор возвращает ошибку в очередь — переходы из плана. */
function useDownloadSimulation(initialChapters: MockChapter[]) {
  const [chapters, setChapters] = useState(initialChapters);
  const hasWork = chapters.some(
    (chapter) =>
      chapter.status === DOWNLOAD_STATUS.QUEUED || chapter.status === DOWNLOAD_STATUS.DOWNLOADING,
  );

  useEffect(() => {
    if (!hasWork) return;
    const timer = window.setInterval(() => {
      setChapters((current) => {
        const activeIndex = current.findIndex(
          (chapter) => chapter.status === DOWNLOAD_STATUS.DOWNLOADING,
        );
        if (activeIndex === -1) {
          const nextIndex = current.findIndex(
            (chapter) => chapter.status === DOWNLOAD_STATUS.QUEUED,
          );
          return current.map((chapter, index) =>
            index === nextIndex ? { ...chapter, status: DOWNLOAD_STATUS.DOWNLOADING } : chapter,
          );
        }
        return current.map((chapter, index) => {
          if (index !== activeIndex) return chapter;
          const pagesDone = chapter.pagesDone + 1;
          const sizeMb = Math.round((pagesDone / chapter.pagesTotal) * 24);
          return pagesDone >= chapter.pagesTotal
            ? { ...chapter, status: DOWNLOAD_STATUS.DONE, pagesDone, sizeMb }
            : { ...chapter, pagesDone, sizeMb };
        });
      });
    }, TICK_MS);
    return () => window.clearInterval(timer);
  }, [hasWork]);

  const handleAction = (chapterId: string, action: ChapterAction) => {
    setChapters((current) =>
      current.map((chapter) => {
        if (chapter.id !== chapterId) return chapter;
        switch (action) {
          case CHAPTER_ACTION.DOWNLOAD:
          case CHAPTER_ACTION.RETRY:
            return { ...chapter, status: DOWNLOAD_STATUS.QUEUED, error: undefined };
          case CHAPTER_ACTION.CANCEL:
          case CHAPTER_ACTION.DELETE:
            return { ...chapter, status: null, error: undefined, pagesDone: 0, sizeMb: 0 };
        }
      }),
    );
  };

  const reset = () => setChapters(initialChapters);

  return { chapters, handleAction, reset };
}

export default useDownloadSimulation;

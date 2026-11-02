import { useCallback, useState } from 'react';
import { generatePath, useNavigate } from 'react-router';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import type { ReaderFeedChapter, ReaderPosition } from '../models';
import { getSpreadStart, getVisiblePageEnd } from '../navigation';

type Params = {
  /** false в вертикальном режиме: хук висит всегда (список страниц общий на оба режима), но
   *  стрелки там листать не должны — «влево» на первой странице уводило бы в прошлую главу. */
  enabled: boolean;
  titleId: string;
  chapters: ReaderFeedChapter[];
  position: ReaderPosition;
  setPosition: (position: ReaderPosition) => void;
  prependChapter: (chapterId: string) => void;
  /** Настройка «Сразу открывать следующую главу». Выключена — с последней страницы листание
   *  ведёт не в следующую главу, а на экран конца главы, и уже с него — дальше. */
  autoNextChapter: boolean;
  /** Главу не открыть: без сети и не скачана. В неё не листаем — показываем экран конца главы. */
  isChapterUnavailable: (chapterId: string) => boolean;
  pageStep: number;
};

/**
 * Постраничная навигация горизонтального режима. На краях главы листание не утыкается в край, а
 * переходит в соседнюю главу — в обе стороны без перезагрузки: вперёд следующая глава к этому
 * моменту обычно уже подклеена к ленте, назад прошлая подклеивается сверху. Настоящий переход
 * остаётся только на случай, когда следующей в ленте ещё нет.
 */
function useHorizontalReaderNavigation({
  enabled,
  titleId,
  chapters,
  position,
  setPosition,
  prependChapter,
  autoNextChapter,
  isChapterUnavailable,
  pageStep,
}: Params) {
  const navigate = useNavigate();
  const chapterIndex = chapters.findIndex((chapter) => chapter.chapterId === position.chapterId);
  const chapter = chapters[chapterIndex];
  const isLastPage = Boolean(
    chapter &&
    chapter.pages.length > 0 &&
    getVisiblePageEnd(position.pageIndex, chapter.pages.length, pageStep) ===
      chapter.pages.length - 1,
  );

  // Экран конца главы — не позиция: в позицию он не пишется, иначе сохранённый прогресс, счётчик
  // страниц и отметка о прочтении получили бы несуществующую страницу. Помним только главу, в
  // конце которой он открыт, и показываем, пока читатель стоит на её последней странице — уход
  // в другую главу (через шапку, drawer) закрывает его сам.
  const [endScreenChapterId, setEndScreenChapterId] = useState<string | null>(null);
  const isChapterEndShown = isLastPage && endScreenChapterId === chapter?.chapterId;

  const goToChapter = useCallback(
    (targetChapterId: string) => {
      navigate(generatePath(ROUTE_PATHS.READER, { titleId, chapterId: targetChapterId }));
    },
    [navigate, titleId],
  );

  const goNext = useCallback(() => {
    if (!enabled || !chapter || chapter.pages.length === 0) return;

    if (!isLastPage) {
      setPosition({
        chapterId: chapter.chapterId,
        pageIndex: getSpreadStart(position.pageIndex, pageStep) + pageStep,
      });
      return;
    }

    const nextInFeed = chapters[chapterIndex + 1];
    const isNextUnavailable = Boolean(
      !nextInFeed && chapter.nextChapterId && isChapterUnavailable(chapter.nextChapterId),
    );
    if ((!autoNextChapter || isNextUnavailable) && !isChapterEndShown) {
      setEndScreenChapterId(chapter.chapterId);
      return;
    }
    if (isNextUnavailable) return;
    if (!nextInFeed && !chapter.nextChapterId) return;
    // Иначе возврат назад на последнюю страницу этой главы снова открыл бы экран её конца.
    setEndScreenChapterId(null);

    if (nextInFeed) {
      setPosition({ chapterId: nextInFeed.chapterId, pageIndex: 0 });
      return;
    }

    if (chapter.nextChapterId) goToChapter(chapter.nextChapterId);
  }, [
    chapter,
    chapterIndex,
    chapters,
    position.pageIndex,
    setPosition,
    goToChapter,
    autoNextChapter,
    isChapterEndShown,
    isChapterUnavailable,
    enabled,
    pageStep,
    isLastPage,
  ]);

  // Назад за начало главы — это всегда конец прошлой: на её первую страницу читатель попадал бы
  // только чтобы тут же пролистать её насквозь. Загруженную главу листаем сразу, остальное берёт
  // на себя лента — она же знает, что номер последней страницы появится только после загрузки.
  const goPrev = useCallback(() => {
    if (!enabled || !chapter) return;

    if (isChapterEndShown) {
      setEndScreenChapterId(null);
      return;
    }

    if (position.pageIndex > 0) {
      setPosition({
        chapterId: chapter.chapterId,
        pageIndex: Math.max(0, getSpreadStart(position.pageIndex, pageStep) - pageStep),
      });
      return;
    }

    const prevInFeed = chapters[chapterIndex - 1];
    if (prevInFeed && prevInFeed.pages.length > 0) {
      setPosition({
        chapterId: prevInFeed.chapterId,
        pageIndex: getSpreadStart(prevInFeed.pages.length - 1, pageStep),
      });
      return;
    }

    if (chapter.prevChapterId) prependChapter(chapter.prevChapterId);
  }, [
    chapter,
    chapterIndex,
    chapters,
    position.pageIndex,
    setPosition,
    prependChapter,
    isChapterEndShown,
    enabled,
    pageStep,
  ]);

  return { goNext, goPrev, isChapterEndShown, resetEndScreen: () => setEndScreenChapterId(null) };
}

export default useHorizontalReaderNavigation;

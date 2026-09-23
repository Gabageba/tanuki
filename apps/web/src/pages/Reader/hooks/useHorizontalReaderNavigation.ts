import { useCallback, useEffect, useState } from 'react';
import { generatePath, useNavigate } from 'react-router';
import { ROUTE_PATHS } from '@/shared/lib/routes';

type Params = {
  /** false в вертикальном режиме: хук висит всегда (список страниц общий на оба режима), но
   *  стрелки там листать не должны — «влево» на первой странице уводило бы в прошлую главу. */
  enabled: boolean;
  titleId: string;
  chapterId: string;
  pagesCount: number;
  prevChapterId: string | null;
  nextChapterId: string | null;
};

/** Постраничная навигация для горизонтального режима: за пределами текущей главы клик/стрелка
 *  сразу переключают на соседнюю главу, а не просто утыкаются в край. */
function useHorizontalReaderNavigation({
  enabled,
  titleId,
  chapterId,
  pagesCount,
  prevChapterId,
  nextChapterId,
}: Params) {
  const navigate = useNavigate();
  const [renderedChapterId, setRenderedChapterId] = useState(chapterId);
  const [pageIndex, setPageIndex] = useState(0);

  // Сбрасывает текущую страницу при смене главы — без эффекта, по правилу "adjusting state when
  // a prop changes": сравнение и setState идут прямо в теле рендера, а не в useEffect.
  if (chapterId !== renderedChapterId) {
    setRenderedChapterId(chapterId);
    setPageIndex(0);
  }

  const goToChapter = useCallback(
    (targetChapterId: string) => {
      navigate(generatePath(ROUTE_PATHS.READER, { titleId, chapterId: targetChapterId }));
    },
    [navigate, titleId],
  );

  const goNext = useCallback(() => {
    if (pageIndex < pagesCount - 1) {
      setPageIndex((index) => index + 1);
    } else if (nextChapterId) {
      goToChapter(nextChapterId);
    }
  }, [pageIndex, pagesCount, nextChapterId, goToChapter]);

  const goPrev = useCallback(() => {
    if (pageIndex > 0) {
      setPageIndex((index) => index - 1);
    } else if (prevChapterId) {
      goToChapter(prevChapterId);
    }
  }, [pageIndex, prevChapterId, goToChapter]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') goNext();
      if (event.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, goNext, goPrev]);

  return { pageIndex, goNext, goPrev };
}

export default useHorizontalReaderNavigation;

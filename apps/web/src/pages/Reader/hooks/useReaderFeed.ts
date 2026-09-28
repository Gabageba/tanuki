import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { generatePath, useNavigate, useSearchParams } from 'react-router';
import { READER_READING_MODE, type ReaderReadingMode } from '@tanuki/contracts';
import { READER_PAGE_SEARCH_PARAM, ROUTE_PATHS } from '@/shared/lib/routes';
import {
  CHAPTER_PRELOAD_REMAINING_PAGES,
  getChapterPagesQueryOptions,
  parseReaderPageParam,
} from '../lib';
import type { ReaderFeedChapter, ReaderPosition } from '../models';
import useCurrentPageObserver from './useCurrentPageObserver';

type Params = {
  titleId: string;
  /** Глава из адреса: начало ленты, а дальше — только точка входа, потому что адрес за чтением
   *  переписываем мы сами. */
  chapterId: string;
  readingMode: ReaderReadingMode;
};

/**
 * Читалка живёт лентой глав, а не одной главой из адреса: дочитанная остаётся сверху, следующая
 * подклеивается снизу заранее. Поэтому и вертикальный скролл, и клик на последней странице в
 * горизонтальном режиме продолжают чтение без перезагрузки и скелетона.
 */
function useReaderFeed({ titleId, chapterId, readingMode }: Params) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [chapterIds, setChapterIds] = useState([chapterId]);
  // Страница из ссылки «Продолжить» читается один раз, при входе: дальше позиция живёт своей
  // жизнью, а параметр убирается из адреса, чтобы перезагрузка не вернула на устаревшее место.
  const [initialPosition] = useState<ReaderPosition>(() => ({
    chapterId,
    pageIndex: parseReaderPageParam(searchParams.get(READER_PAGE_SEARCH_PARAM)),
  }));
  const [position, setPosition] = useState<ReaderPosition>(initialPosition);
  const [renderedChapterId, setRenderedChapterId] = useState(chapterId);
  // В вертикальном режиме к восстановленной странице ещё нужно прокрутить.
  const [scrollTarget, setScrollTarget] = useState<ReaderPosition | null>(
    initialPosition.pageIndex > 0 ? initialPosition : null,
  );
  const [tailChapterId, setTailChapterId] = useState<string | null>(null);

  const { registerPage, scrollToPosition, isPinned } = useCurrentPageObserver({
    enabled: readingMode === READER_READING_MODE.VERTICAL,
    onChange: setPosition,
  });

  const results = useQueries({
    queries: chapterIds.map((id) => getChapterPagesQueryOptions(titleId, id)),
  });

  const chapters: ReaderFeedChapter[] = chapterIds.map((id, index) => ({
    chapterId: id,
    pages: results[index]?.data?.items ?? [],
    prevChapterId: results[index]?.data?.prevChapterId ?? null,
    nextChapterId: results[index]?.data?.nextChapterId ?? null,
    isPending: results[index]?.isPending ?? true,
    isError: results[index]?.isError ?? false,
    error: results[index]?.error ?? null,
    refetch: () => {
      void results[index]?.refetch();
    },
  }));

  /**
   * Вперёд лента растёт сама, а назад — только этим: из главы, открытой по ссылке, прошлой в ленте
   * нет. Читатель уходит за её начало, то есть приходит в конец прошлой главы, но сколько в ней
   * страниц — известно только после загрузки. Поэтому позиция сразу переезжает на новую главу, а
   * в хвост её доставляет tailChapterId, когда страницы приедут: до тех пор активная глава пуста
   * и читатель видит загрузку, а не застывшую страницу, с которой он уже ушёл.
   */
  const prependChapter = useCallback((targetChapterId: string) => {
    setChapterIds((ids) => (ids.includes(targetChapterId) ? ids : [targetChapterId, ...ids]));
    setPosition({ chapterId: targetChapterId, pageIndex: 0 });
    setTailChapterId(targetChapterId);
  }, []);

  const tailChapter = chapters.find((chapter) => chapter.chapterId === tailChapterId);

  // Адрес при переходе в следующую главу переписываем мы сами, поэтому разойтись с чтением он
  // может только снаружи: кнопки соседних глав, выбор в drawer'е, прямая ссылка. Уже прочитанная
  // глава в ленте остаётся, к её началу просто прокручиваемся; незнакомая начинает ленту заново.
  // Сравнение и setState идут прямо в теле рендера — правило "adjusting state when a prop changes".
  if (chapterId !== renderedChapterId) {
    setRenderedChapterId(chapterId);

    if (chapterId !== position.chapterId) {
      setPosition({ chapterId, pageIndex: 0 });
      setScrollTarget({ chapterId, pageIndex: 0 });
      setTailChapterId(null);
      if (!chapterIds.includes(chapterId)) {
        setChapterIds([chapterId]);
      }
    }
  } else if (tailChapter && tailChapter.pages.length > 0) {
    // Страницы подклеенной сверху главы приехали — теперь известен номер последнего разворота, на
    // который читатель и шёл. Ветка именно else: переход, случившийся за время загрузки, увёл
    // чтение в другую главу, и возвращать его в хвост этой уже некуда.
    setTailChapterId(null);
    setPosition({ chapterId: tailChapter.chapterId, pageIndex: tailChapter.pages.length - 1 });
  }

  // Следующую главу тянем не сразу, а когда до конца ленты осталось несколько страниц: иначе
  // трафик уходил бы и на тех, кто закрыл тайтл на второй странице.
  const lastChapter = chapters.at(-1);
  const isNearFeedEnd = Boolean(
    lastChapter &&
    lastChapter.chapterId === position.chapterId &&
    lastChapter.pages.length > 0 &&
    position.pageIndex >= lastChapter.pages.length - CHAPTER_PRELOAD_REMAINING_PAGES,
  );
  const chapterIdToAppend = (isNearFeedEnd && lastChapter?.nextChapterId) || null;
  if (chapterIdToAppend && !chapterIds.includes(chapterIdToAppend)) {
    setChapterIds([...chapterIds, chapterIdToAppend]);
  }

  const activeChapter = chapters.find((chapter) => chapter.chapterId === position.chapterId);

  // Сохранённая страница могла исчезнуть: источник пересобрал главу, и страниц стало меньше.
  // Тогда встаём на последнюю, а не на пустое место за концом главы.
  const activePagesLength = activeChapter?.pages.length ?? 0;
  if (activePagesLength > 0 && position.pageIndex >= activePagesLength) {
    setPosition({ chapterId: position.chapterId, pageIndex: activePagesLength - 1 });
  }

  useEffect(() => {
    if (!searchParams.has(READER_PAGE_SEARCH_PARAM)) return;

    setSearchParams(
      (params) => {
        params.delete(READER_PAGE_SEARCH_PARAM);
        return params;
      },
      { replace: true },
    );
  }, [searchParams, setSearchParams]);

  // replace, а не push: иначе выход из читалки после десятка глав требовал бы десятка «назад».
  useEffect(() => {
    if (position.chapterId === chapterId) return;

    navigate(generatePath(ROUTE_PATHS.READER, { titleId, chapterId: position.chapterId }), {
      replace: true,
    });
  }, [position.chapterId, chapterId, titleId, navigate]);

  // Цель прокрутки не сбрасывается после использования: эффект и так срабатывает только на новую
  // цель, а сброс означал бы setState внутри эффекта.
  useLayoutEffect(() => {
    if (!scrollTarget) return;

    scrollToPosition(scrollTarget);
  }, [scrollTarget, scrollToPosition]);

  // Смена режима не должна терять место: в горизонтальном позиция и так показана страницей на
  // экране, а вертикальную ленту к ней нужно прокрутить.
  const renderedReadingMode = useRef(readingMode);
  useLayoutEffect(() => {
    if (renderedReadingMode.current === readingMode) return;

    renderedReadingMode.current = readingMode;
    if (readingMode === READER_READING_MODE.VERTICAL) scrollToPosition(position);
  }, [readingMode, position, scrollToPosition]);

  return {
    chapters,
    activeChapter,
    position,
    setPosition,
    prependChapter,
    registerPage,
    /** Лента сама держит страницу на месте, и прокрутка сейчас не от читателя. */
    isPinned,
    /** Скелетон во весь экран — только для первой загрузки, когда показать нечего в принципе.
     *  Глава, подклеенная к уже прочитанным, ждёт лоадером и картинки из ленты не выкидывает. */
    isPending: chapters.every((chapter) => chapter.isPending),
  };
}

export default useReaderFeed;

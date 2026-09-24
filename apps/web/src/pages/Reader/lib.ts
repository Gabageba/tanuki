import { queryOptions } from '@tanstack/react-query';
import { READER_PAGE_FIT, type PagesResponse, type ReaderPageFit } from '@tanuki/contracts';
import { apiFetch } from '@/shared/api/client';
import type { ReaderPosition } from './models';

// manga-страница обычно выше, чем шире — используется, пока реальные width/height ещё не пришли
export const DEFAULT_PAGE_RATIO = 2 / 3;

export const SKELETON_PAGES_COUNT = 3;

// Ровно экран: шапка объявлена с offset: false (см. Reader/index.tsx), поэтому места под себя не
// занимает и её показ/скрытие доступную высоту не меняет.
export const READER_CONTENT_MIN_HEIGHT = '100dvh';

export const TITLE_NAME_MIN_WIDTH = 180;

/** За сколько страниц до конца ленты запрашивается следующая глава. */
export const CHAPTER_PRELOAD_REMAINING_PAGES = 3;

/** Схлопывает область наблюдения IntersectionObserver в горизонтальную линию по центру окна:
 *  пересекает её всегда ровно одна страница — она и считается текущей. */
export const CURRENT_PAGE_ROOT_MARGIN = '-50% 0px -50% 0px';

/** Собственная прокрутка читателя — колесо, палец, клавиши: после неё восстановленную страницу
 *  больше не удерживаем. Событие scroll не годится — его вызывает и сама подгонка. */
export const PIN_RELEASE_EVENTS = ['wheel', 'touchmove', 'keydown'] as const;

export const getChapterPagesQueryOptions = (titleId: string, chapterId: string) =>
  queryOptions({
    queryKey: ['pages', titleId, chapterId],
    queryFn: () => apiFetch<PagesResponse>(`/titles/${titleId}/chapters/${chapterId}/pages`),
  });

export const getReaderPageKey = ({ chapterId, pageIndex }: ReaderPosition) =>
  `${chapterId}#${pageIndex}`;

/** Главу и номер страницы элемент несёт в data-атрибутах — так ref-колбэк для наблюдателя остаётся
 *  одной стабильной функцией на весь список, а не новой замыканием на каждую страницу. */
export const getReaderPagePosition = (element: Element): ReaderPosition | null => {
  if (!(element instanceof HTMLElement)) return null;

  const { chapterId, pageIndex } = element.dataset;
  if (!chapterId || !pageIndex) return null;

  return { chapterId, pageIndex: Number(pageIndex) };
};

/** Без элемента прокручивает наверх: значит лента только что пересобралась с нужной главы и её
 *  начало — и есть самый верх. */
/** `?page=` из ссылки «Продолжить» — номер с единицы, в позицию он ложится индексом. Мусор и
 *  отсутствие параметра значат начало главы. */
export const parseReaderPageParam = (value: string | null) => {
  const page = Number.parseInt(value ?? '', 10);
  return Number.isNaN(page) ? 0 : Math.max(0, page - 1);
};

export const scrollToReaderPage = (element?: HTMLElement) => {
  const top = element ? element.getBoundingClientRect().top + window.scrollY : 0;
  window.scrollTo({ top, behavior: 'instant' });
};

/**
 * FIT_WIDTH: страница занимает всю ширину контейнера, высота считается через aspect-ratio.
 * FIT_HEIGHT: страница должна поместиться в экран целиком — и по высоте, и по ширине, поэтому
 * ширина берётся как минимум из ширины контейнера и ширины страницы, растянутой на всю высоту
 * экрана. Считать через height: 100dvh нельзя: картинка лежит во флекс-колонке, а там упор
 * ширины в max-width не уменьшает высоту — широкий разворот либо вылезал бы за экран, либо
 * вписывался в бокс во весь экран, оставляя вокруг себя пустые поля.
 */
export const getReaderImageDimensionProps = (
  pageFit: ReaderPageFit,
  containerWidth: number,
  ratio: number,
) => {
  switch (pageFit) {
    case READER_PAGE_FIT.FIT_WIDTH:
      return { w: '100%', h: 'auto', maw: containerWidth };
    case READER_PAGE_FIT.FIT_HEIGHT:
      return { w: `min(100%, calc(${READER_CONTENT_MIN_HEIGHT} * ${ratio}))`, h: 'auto' };
  }
};

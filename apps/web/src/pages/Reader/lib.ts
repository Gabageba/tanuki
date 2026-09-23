import { READER_PAGE_FIT, type ReaderPageFit } from '@tanuki/contracts';

// manga-страница обычно выше, чем шире — используется, пока реальные width/height ещё не пришли
export const DEFAULT_PAGE_RATIO = 2 / 3;

export const SKELETON_PAGES_COUNT = 3;

// Ровно экран: шапка объявлена с offset: false (см. Reader/index.tsx), поэтому места под себя не
// занимает и её показ/скрытие доступную высоту не меняет.
export const READER_CONTENT_MIN_HEIGHT = '100dvh';

export const TITLE_NAME_MIN_WIDTH = 180;

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

// manga-страница обычно выше, чем шире — используется, пока реальные width/height ещё не пришли
export const DEFAULT_PAGE_RATIO = 2 / 3;

export const SKELETON_PAGES_COUNT = 3;

export const READER_IMAGE_WIDTH_PROPS = {
  w: '100%',
  maw: 900,
};

// шапка оверлеем: её отступ приходит из AppShell и обнуляется, когда шапка скрыта
export const READER_CONTENT_MIN_HEIGHT = 'calc(100dvh - var(--app-shell-header-offset, 0px))';

export const TITLE_NAME_MIN_WIDTH = 180;

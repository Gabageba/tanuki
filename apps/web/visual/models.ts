/** Порт, на котором `serve.ts` раздаёт собранный Storybook. */
export const PORT = 6007;

/** Собранный Storybook (`pnpm storybook:build`) — его и снимают тесты. */
export const STORYBOOK_STATIC_URL = new URL('../storybook-static/', import.meta.url);

/**
 * «Сейчас» для всех историй: «2 дня назад» и графики статистики не должны съезжать от даты
 * прогона. Совпадает с днём, вокруг которого собраны фикстуры (`shared/storybook`).
 */
export const FIXED_NOW = new Date('2026-10-16T12:00:00Z');

/** Обычный вьюпорт истории. */
export const DESKTOP_VIEWPORT = { width: 1280, height: 800 };

/** `MOBILE_GLOBALS` — вьюпорт Storybook «Large mobile». */
export const MOBILE_VIEWPORT_ID = 'mobile2';
export const MOBILE_VIEWPORT = { width: 414, height: 896 };

/** Тип записи `storybook-static/index.json` — значение задаёт Storybook. */
export const INDEX_ENTRY_TYPE = {
  STORY: 'story',
} as const;

/** Запись `storybook-static/index.json`. */
export type IndexEntry = {
  id: string;
  title: string;
  name: string;
  type: string;
};

/** Конечные стадии отрисовки истории в превью Storybook — значения задаёт Storybook. */
export const RENDER_PHASE = {
  /** Отрисована, `play` отработал. */
  FINISHED: 'finished',
  /** Упала при отрисовке или в `play`. */
  ERRORED: 'errored',
} as const;

export type StorybookWindow = Window & {
  __STORYBOOK_PREVIEW__?: {
    currentRender?: {
      phase?: string;
      story?: { storyGlobals?: { viewport?: { value?: string } } };
    };
  };
};

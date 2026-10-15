import type { EnumLiteralsOf } from '@tanuki/contracts';

/** Каркас вокруг страницы в истории — тот же, что у её маршрута в RouterProvider. */
export const STORY_LAYOUT = {
  /** Шапка и нижняя панель приложения (`app/Layout`). */
  APP: 'app',
  /** Экраны входа и регистрации (`app/AuthLayout`). */
  AUTH: 'auth',
  /** Без каркаса — читалка. */
  NONE: 'none',
} as const;
export type StoryLayout = EnumLiteralsOf<typeof STORY_LAYOUT>;

/** `parameters.route` истории страницы: шаблон маршрута, открытый адрес и каркас. */
export type StoryRoute = {
  path: string;
  url: string;
  layout: StoryLayout;
};

/** `globals` истории на ширине телефона — вьюпорт Storybook «Large mobile», 414 px. */
export const MOBILE_GLOBALS = { viewport: { value: 'mobile2', isRotated: false } };

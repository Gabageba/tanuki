import type { EnumLiteralsOf } from '@tanuki/contracts';
import type { ChapterSnapshotRow, DownloadRow, TitleSnapshotRow } from '@/entities/download/models';

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

/** `parameters.footer`: нижняя панель приложения под компонентом без маршрута. */
export const STORY_FOOTER = {
  /** Неактивная панель — по умолчанию, как на страницах приложения. */
  PANEL: 'panel',
  /** Только её место: история показывает кнопку самой панели, вторая копия панели не нужна. */
  SPACE: 'space',
  /** Ни панели, ни места под неё — читалка. */
  NONE: 'none',
} as const;
export type StoryFooter = EnumLiteralsOf<typeof STORY_FOOTER>;

/** `parameters.route` истории страницы: шаблон маршрута, открытый адрес и каркас. */
export type StoryRoute = {
  path: string;
  url: string;
  layout: StoryLayout;
};

/** `globals` истории на ширине телефона — вьюпорт Storybook «Large mobile», 414 px. */
export const MOBILE_GLOBALS = { viewport: { value: 'mobile2', isRotated: false } };

/** `parameters.offlineDb`: что лежит в базе скачанного зрителя (Dexie) на старте истории. */
export type OfflineDbSeed = {
  downloads: DownloadRow[];
  chapters: ChapterSnapshotRow[];
  titles: TitleSnapshotRow[];
  isPaused: boolean;
};

import type { CSSProperties } from 'react';
import type { QueryClient } from '@tanstack/react-query';
import {
  ArchiveIcon,
  BookmarkSimpleIcon,
  BookOpenIcon,
  CheckCircleIcon,
  ClockIcon,
  CoffeeIcon,
  CrownIcon,
  FireIcon,
  FlagIcon,
  GhostIcon,
  HeartIcon,
  LeafIcon,
  LightningIcon,
  MoonIcon,
  PuzzlePieceIcon,
  SmileyIcon,
  StarIcon,
  SwordIcon,
  type IconWeight,
} from '@phosphor-icons/react';
import type { TFunction } from 'i18next';
import {
  BOOKMARK_FOLDER_COLOR,
  BOOKMARK_FOLDER_ICON,
  BUILT_IN_BOOKMARK_FOLDER,
  type BookmarkFolder,
  type BookmarkFolderColor,
  type BookmarkFolderIcon,
  type BuiltInBookmarkFolder,
} from '@tanuki/contracts';
import { getMutedBackground } from '@/shared/lib/palette';
import {
  BOOKMARK_FOLDERS_QUERY_KEY,
  BOOKMARKS_QUERY_KEY,
  TITLE_BOOKMARK_QUERY_KEY,
  type ResolvedBookmarkFolder,
} from './models';

type IconProps = {
  size?: number;
  weight?: IconWeight;
  color?: string;
};

/** Иконка папки готовым элементом: компонент, полученный вызовом в рендере, ругает линт. */
export const renderBookmarkFolderIcon = (icon: BookmarkFolderIcon, props: IconProps = {}) => {
  switch (icon) {
    case BOOKMARK_FOLDER_ICON.BOOKMARK:
      return <BookmarkSimpleIcon {...props} />;
    case BOOKMARK_FOLDER_ICON.BOOK_OPEN:
      return <BookOpenIcon {...props} />;
    case BOOKMARK_FOLDER_ICON.CLOCK:
      return <ClockIcon {...props} />;
    case BOOKMARK_FOLDER_ICON.CHECK_CIRCLE:
      return <CheckCircleIcon {...props} />;
    case BOOKMARK_FOLDER_ICON.ARCHIVE:
      return <ArchiveIcon {...props} />;
    case BOOKMARK_FOLDER_ICON.HEART:
      return <HeartIcon {...props} />;
    case BOOKMARK_FOLDER_ICON.STAR:
      return <StarIcon {...props} />;
    case BOOKMARK_FOLDER_ICON.FIRE:
      return <FireIcon {...props} />;
    case BOOKMARK_FOLDER_ICON.LIGHTNING:
      return <LightningIcon {...props} />;
    case BOOKMARK_FOLDER_ICON.CROWN:
      return <CrownIcon {...props} />;
    case BOOKMARK_FOLDER_ICON.SWORD:
      return <SwordIcon {...props} />;
    case BOOKMARK_FOLDER_ICON.GHOST:
      return <GhostIcon {...props} />;
    case BOOKMARK_FOLDER_ICON.MOON:
      return <MoonIcon {...props} />;
    case BOOKMARK_FOLDER_ICON.LEAF:
      return <LeafIcon {...props} />;
    case BOOKMARK_FOLDER_ICON.COFFEE:
      return <CoffeeIcon {...props} />;
    case BOOKMARK_FOLDER_ICON.SMILEY:
      return <SmileyIcon {...props} />;
    case BOOKMARK_FOLDER_ICON.FLAG:
      return <FlagIcon {...props} />;
    case BOOKMARK_FOLDER_ICON.PUZZLE:
      return <PuzzlePieceIcon {...props} />;
  }
};

export const getBuiltInBookmarkFolderLabel = (folder: BuiltInBookmarkFolder, t: TFunction) => {
  switch (folder) {
    case BUILT_IN_BOOKMARK_FOLDER.READING:
      return t('reading');
    case BUILT_IN_BOOKMARK_FOLDER.PLANNED:
      return t('planned');
    case BUILT_IN_BOOKMARK_FOLDER.COMPLETED:
      return t('completed');
    case BUILT_IN_BOOKMARK_FOLDER.DROPPED:
      return t('dropped');
  }
};

/** Смысловые контурные иконки встроенных папок (I1). */
export const getBuiltInBookmarkFolderIcon = (folder: BuiltInBookmarkFolder): BookmarkFolderIcon => {
  switch (folder) {
    case BUILT_IN_BOOKMARK_FOLDER.READING:
      return BOOKMARK_FOLDER_ICON.BOOK_OPEN;
    case BUILT_IN_BOOKMARK_FOLDER.PLANNED:
      return BOOKMARK_FOLDER_ICON.CLOCK;
    case BUILT_IN_BOOKMARK_FOLDER.COMPLETED:
      return BOOKMARK_FOLDER_ICON.CHECK_CIRCLE;
    case BUILT_IN_BOOKMARK_FOLDER.DROPPED:
      return BOOKMARK_FOLDER_ICON.ARCHIVE;
  }
};

/** Цвета встроенных — из общей палитры папок; «Брошено» серое: оно про неактивное. */
export const getBuiltInBookmarkFolderColor = (
  folder: BuiltInBookmarkFolder,
): BookmarkFolderColor => {
  switch (folder) {
    case BUILT_IN_BOOKMARK_FOLDER.READING:
      return BOOKMARK_FOLDER_COLOR.BLUE;
    case BUILT_IN_BOOKMARK_FOLDER.PLANNED:
      return BOOKMARK_FOLDER_COLOR.VIOLET;
    case BUILT_IN_BOOKMARK_FOLDER.COMPLETED:
      return BOOKMARK_FOLDER_COLOR.TEAL;
    case BUILT_IN_BOOKMARK_FOLDER.DROPPED:
      return BOOKMARK_FOLDER_COLOR.GRAY;
  }
};

export const getBookmarkFolderColorLabel = (color: BookmarkFolderColor, t: TFunction) => {
  switch (color) {
    case BOOKMARK_FOLDER_COLOR.BLUE:
      return t('blue');
    case BOOKMARK_FOLDER_COLOR.CYAN:
      return t('cyan');
    case BOOKMARK_FOLDER_COLOR.TEAL:
      return t('teal');
    case BOOKMARK_FOLDER_COLOR.LIME:
      return t('lime');
    case BOOKMARK_FOLDER_COLOR.YELLOW:
      return t('yellow');
    case BOOKMARK_FOLDER_COLOR.ORANGE:
      return t('orange');
    case BOOKMARK_FOLDER_COLOR.PINK:
      return t('pink');
    case BOOKMARK_FOLDER_COLOR.GRAPE:
      return t('grape');
    case BOOKMARK_FOLDER_COLOR.VIOLET:
      return t('violet');
    case BOOKMARK_FOLDER_COLOR.INDIGO:
      return t('indigo');
    case BOOKMARK_FOLDER_COLOR.GRAY:
      return t('gray');
  }
};

export const resolveBookmarkFolder = (
  folder: BookmarkFolder,
  t: TFunction,
): ResolvedBookmarkFolder => ({
  ...folder,
  name: folder.builtIn ? getBuiltInBookmarkFolderLabel(folder.builtIn, t) : (folder.name ?? ''),
  icon: folder.builtIn
    ? getBuiltInBookmarkFolderIcon(folder.builtIn)
    : (folder.icon ?? BOOKMARK_FOLDER_ICON.BOOKMARK),
  color: folder.builtIn
    ? getBuiltInBookmarkFolderColor(folder.builtIn)
    : (folder.color ?? BOOKMARK_FOLDER_COLOR.BLUE),
});

/** Текст и иконка — цветом папки; у серой — цвет пояснений, иначе почти не видно. */
export const getBookmarkFolderTextColor = (color: BookmarkFolderColor) =>
  color === BOOKMARK_FOLDER_COLOR.GRAY
    ? 'var(--mantine-color-dimmed)'
    : `var(--mantine-color-${color}-text)`;

/**
 * Выбранная папка в списке выбора — в её цвете, а не в акценте: подложка, рамка и текст. Тот же
 * приём в «В закладки», меню читалки и модалке склейки (S4, M1d).
 */
export const getBookmarkFolderTintStyle = (color: BookmarkFolderColor): CSSProperties => ({
  color: getBookmarkFolderTextColor(color),
  backgroundColor: getMutedBackground(color, true),
  borderColor: `var(--mantine-color-${color}-filled)`,
});

/** Любая правка закладок или папок: счётчики вкладок, списки, метки и папка тайтла. */
export const invalidateBookmarks = (queryClient: QueryClient) =>
  Promise.all([
    queryClient.invalidateQueries({ queryKey: BOOKMARK_FOLDERS_QUERY_KEY }),
    queryClient.invalidateQueries({ queryKey: BOOKMARKS_QUERY_KEY }),
    queryClient.invalidateQueries({ queryKey: TITLE_BOOKMARK_QUERY_KEY }),
  ]);

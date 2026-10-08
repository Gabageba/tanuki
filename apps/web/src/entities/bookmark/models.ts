import type { BookmarkFolder, BookmarkFolderColor, BookmarkFolderIcon } from '@tanuki/contracts';

/** Папка, у которой уже есть название, иконка и цвет — у встроенных их задаёт фронт. */
export type ResolvedBookmarkFolder = Omit<BookmarkFolder, 'name' | 'icon' | 'color'> & {
  name: string;
  icon: BookmarkFolderIcon;
  color: BookmarkFolderColor;
};

export const BOOKMARK_FOLDERS_QUERY_KEY = ['bookmark-folders'] as const;
/** Списки закладок и метки на карточках — всё, что меняется вместе с любой закладкой. */
export const BOOKMARKS_QUERY_KEY = ['bookmarks'] as const;
export const TITLE_BOOKMARK_QUERY_KEY = ['title-bookmark'] as const;

export const getTitleBookmarkQueryKey = (titleId: string) =>
  [...TITLE_BOOKMARK_QUERY_KEY, titleId] as const;

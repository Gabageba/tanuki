import type { ResolvedBookmarkFolder } from '../models';
import useBookmarkFolders from './useBookmarkFolders';
import useBookmarksLookup from './useBookmarksLookup';

/** Папка закладки для каждой карточки каталога или поиска: titleId → папка или null. */
function useTitleBookmarkFolders(titleIds: string[]) {
  const { data: folders } = useBookmarkFolders();
  const lookup = useBookmarksLookup(titleIds);

  return (titleId: string): ResolvedBookmarkFolder | null => {
    const folderId = lookup[titleId];
    return folders?.items.find(({ id }) => id === folderId) ?? null;
  };
}

export default useTitleBookmarkFolders;

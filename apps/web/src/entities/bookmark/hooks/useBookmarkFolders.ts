import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { BookmarkFoldersResponse } from '@tanuki/contracts';
import { apiFetch } from '@/shared/api/client';
import { resolveBookmarkFolder } from '../lib';
import { BOOKMARK_FOLDERS_QUERY_KEY } from '../models';

/**
 * Папки по порядку вкладок со счётчиками и признаком новых глав — уже с названием, иконкой и
 * цветом: у встроенных их задаёт фронт, на языке интерфейса.
 */
function useBookmarkFolders() {
  const { t } = useTranslation();

  return useQuery({
    queryKey: BOOKMARK_FOLDERS_QUERY_KEY,
    queryFn: () => apiFetch<BookmarkFoldersResponse>('/bookmark-folders'),
    select: ({ items, hasNew }) => ({
      items: items.map((folder) => resolveBookmarkFolder(folder, t)),
      hasNew,
    }),
  });
}

export default useBookmarkFolders;

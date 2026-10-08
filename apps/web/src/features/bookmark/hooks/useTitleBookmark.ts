import { useQuery } from '@tanstack/react-query';
import type { TitleBookmark } from '@tanuki/contracts';
import { apiFetch } from '@/shared/api/client';
import { getTitleBookmarkQueryKey } from '@/entities/bookmark/models';

/** Папка тайтла с учётом его подтверждённых совпадений. */
function useTitleBookmark(titleId: string) {
  return useQuery({
    queryKey: getTitleBookmarkQueryKey(titleId),
    queryFn: () => apiFetch<TitleBookmark>(`/titles/${titleId}/bookmark`),
  });
}

export default useTitleBookmark;

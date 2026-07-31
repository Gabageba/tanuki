import { useQuery } from '@tanstack/react-query';
import type { ChaptersResponse, MangaDetailsResponse, PagesResponse } from '@tanuki/contracts';
import { apiFetch } from './client';

export function useMangaDetails(sourceId: string, mangaId: string) {
  return useQuery({
    queryKey: ['manga', sourceId, mangaId],
    queryFn: () => apiFetch<MangaDetailsResponse>(`/manga/${sourceId}/${mangaId}`),
  });
}

export function useChapters(sourceId: string, mangaId: string, branch?: string) {
  return useQuery({
    queryKey: ['chapters', sourceId, mangaId, branch ?? null],
    queryFn: () =>
      apiFetch<ChaptersResponse>(
        `/manga/${sourceId}/${mangaId}/chapters${branch ? `?branch=${encodeURIComponent(branch)}` : ''}`,
      ),
  });
}

export function useChapterPages(sourceId: string, mangaId: string, chapterId: string) {
  return useQuery({
    queryKey: ['pages', sourceId, mangaId, chapterId],
    queryFn: () =>
      apiFetch<PagesResponse>(`/manga/${sourceId}/${mangaId}/chapters/${chapterId}/pages`),
  });
}

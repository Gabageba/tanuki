import { useQuery } from '@tanstack/react-query';
import type { ReaderSettings } from '@tanuki/contracts';
import { apiFetch } from '@/shared/api/client';

export const READER_SETTINGS_QUERY_KEY = ['reader-settings'] as const;

function useReaderSettings() {
  return useQuery({
    queryKey: READER_SETTINGS_QUERY_KEY,
    queryFn: () => apiFetch<ReaderSettings>('/reader-settings'),
    staleTime: 60_000,
  });
}

export default useReaderSettings;

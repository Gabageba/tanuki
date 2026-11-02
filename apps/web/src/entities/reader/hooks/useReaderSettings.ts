import { useQuery } from '@tanstack/react-query';
import { ReaderSettingsSchema } from '@tanuki/contracts';
import { apiFetch } from '@/shared/api/client';

export const READER_SETTINGS_QUERY_KEY = ['reader-settings'] as const;

function useReaderSettings() {
  return useQuery({
    queryKey: READER_SETTINGS_QUERY_KEY,
    // Cached offline responses from an older app version need the new fields' defaults too.
    queryFn: async () => ReaderSettingsSchema.parse(await apiFetch<unknown>('/reader-settings')),
    staleTime: 60_000,
  });
}

export default useReaderSettings;

import { useQuery } from '@tanstack/react-query';
import type { ContinueReadingResponse } from '@tanuki/contracts';
import { CONTINUE_READING_QUERY_KEY } from '@/entities/title/models';
import { apiFetch } from '@/shared/api/client';

/** «Продолжить чтение» — последние тайтлы, которые читал пользователь, свежие первыми. */
function useContinueReading() {
  return useQuery({
    queryKey: CONTINUE_READING_QUERY_KEY,
    queryFn: () => apiFetch<ContinueReadingResponse>('/reading-progress/recent'),
  });
}

export default useContinueReading;

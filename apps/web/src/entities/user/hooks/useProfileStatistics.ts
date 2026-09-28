import { useQuery } from '@tanstack/react-query';
import type { ProfileStatisticsResponse } from '@tanuki/contracts';
import { apiFetch } from '@/shared/api/client';

export const PROFILE_STATISTICS_QUERY_KEY = ['profile-statistics'] as const;

function useProfileStatistics() {
  return useQuery({
    queryKey: PROFILE_STATISTICS_QUERY_KEY,
    queryFn: () => apiFetch<ProfileStatisticsResponse>('/users/me/statistics'),
    // Цифры меняет читалка, а не эта страница: после каждой прочитанной главы профиль должен
    // открываться со свежими данными, а не с кешем минутной давности.
    staleTime: 0,
  });
}

export default useProfileStatistics;

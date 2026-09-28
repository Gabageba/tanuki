import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { FiltersResponse } from '@tanuki/contracts';
import { apiFetch } from '@/shared/api/client';
import type { ErrorMeta } from '@/shared/api/errorMeta';

type Params = {
  sourceId: string | undefined;
};

function useFilters({ sourceId }: Params) {
  const { t } = useTranslation();

  return useQuery({
    queryKey: ['filters', sourceId],
    queryFn: () => apiFetch<FiltersResponse>(`/sources/${sourceId}/filters`),
    enabled: !!sourceId,
    staleTime: Infinity,
    // Каталог живёт и без фильтров: при ошибке кнопка «Фильтры» просто не появляется, а о сбое
    // говорит уведомление.
    meta: { errorTitle: t('failedToLoadFilters') } satisfies ErrorMeta,
  });
}

export default useFilters;

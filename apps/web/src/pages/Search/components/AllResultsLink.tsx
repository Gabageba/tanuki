import { generatePath } from 'react-router';
import { useTranslation } from 'react-i18next';
import type { FilterSelection } from '@tanuki/contracts';
import { serializeFilters } from '@/features/filters/lib/filterSelection';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import ArrowLink from '@/shared/ui/ArrowLink';

type Props = {
  sourceId: string;
  query: string;
  filters: FilterSelection[];
};

/** «Все результаты» — в каталог источника с тем же запросом и фильтрами: там своя пагинация. */
function AllResultsLink({ sourceId, query, filters }: Props) {
  const { t } = useTranslation();
  const params = new URLSearchParams({ query });
  for (const value of serializeFilters(filters)) params.append('filters', value);
  const path = `${generatePath(ROUTE_PATHS.CATALOG, { sourceId })}?${params}`;

  return <ArrowLink to={path}>{t('allResults')}</ArrowLink>;
}

export default AllResultsLink;

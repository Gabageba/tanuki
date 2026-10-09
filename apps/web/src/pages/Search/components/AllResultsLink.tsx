import { Anchor, Group } from '@mantine/core';
import { Link, generatePath } from 'react-router';
import { ArrowRightIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import type { FilterSelection } from '@tanuki/contracts';
import { serializeFilters } from '@/features/filters/lib/filterSelection';
import { ROUTE_PATHS } from '@/shared/lib/routes';

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

  return (
    <Anchor component={Link} to={path} fz="sm" flex="none">
      <Group gap={4} wrap="nowrap">
        {t('allResults')}
        <ArrowRightIcon />
      </Group>
    </Anchor>
  );
}

export default AllResultsLink;

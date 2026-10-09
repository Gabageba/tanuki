import { useState } from 'react';
import { Stack } from '@mantine/core';
import { useSearchParams } from 'react-router';
import {
  SORT_DIRECTION,
  type SortDirection,
  type SourceContentType,
  type SourceStatus,
} from '@tanuki/contracts';
import PageLayout from '@/shared/ui/PageLayout';
import { flattenSources } from '@/entities/source/lib';
import { SOURCES_HEALTH_SOURCE_SEARCH_PARAM } from '@/shared/lib/routes';
import HealthFilters from './HealthFilters';
import HealthList from './HealthList';
import SourceDrawer from './SourceDrawer';
import {
  HEALTH_SORT,
  filterSources,
  getDefaultSortDirection,
  sortSources,
  type HealthSort,
  type SourcesHealthQuery,
} from './models';

type Props = {
  isStaff: boolean;
};

/** Фильтры, таблица и карточка источника. Источников два десятка и все приходят одним запросом,
 *  поэтому фильтрует и сортирует клиент, без поиска и страниц. По умолчанию лежащие сверху. */
function SourcesHealthTable({ isStaff }: Props) {
  const { data, isPending } = PageLayout.useQuery<SourcesHealthQuery>();
  const [status, setStatus] = useState<SourceStatus[]>([]);
  const [contentType, setContentType] = useState<SourceContentType[]>([]);
  const [sort, setSort] = useState<HealthSort>(HEALTH_SORT.STATUS);
  const [direction, setDirection] = useState<SortDirection>(SORT_DIRECTION.ASC);
  // id в адресе, а не снимок: после проверки и опроса карточка сразу показывает свежий статус,
  // а уведомление об источнике открывает его карточку.
  const [searchParams, setSearchParams] = useSearchParams();
  const openedId = searchParams.get(SOURCES_HEALTH_SOURCE_SEARCH_PARAM);

  const all = flattenSources(data);
  const sources = sortSources(filterSources(all, { status, contentType }), sort, direction);
  const opened = all.find((source) => source.id === openedId) ?? null;

  /** Повторный клик по тому же ключу разворачивает направление. */
  const handleSortChange = (next: HealthSort) => {
    if (next === sort) {
      setDirection(direction === SORT_DIRECTION.ASC ? SORT_DIRECTION.DESC : SORT_DIRECTION.ASC);
    } else {
      setSort(next);
      setDirection(getDefaultSortDirection(next));
    }
  };

  const handleOpenedChange = (sourceId: string | null) => {
    setSearchParams(sourceId ? { [SOURCES_HEALTH_SOURCE_SEARCH_PARAM]: sourceId } : {}, {
      replace: true,
    });
  };

  const handleReset = () => {
    setStatus([]);
    setContentType([]);
  };

  return (
    <Stack gap="md">
      <HealthFilters
        status={status}
        contentType={contentType}
        onStatusChange={setStatus}
        onContentTypeChange={setContentType}
      />
      <HealthList
        sources={sources}
        isPending={isPending}
        sort={sort}
        direction={direction}
        onSortChange={handleSortChange}
        onOpen={(source) => handleOpenedChange(source.id)}
        onReset={handleReset}
      />
      <SourceDrawer source={opened} isStaff={isStaff} onClose={() => handleOpenedChange(null)} />
    </Stack>
  );
}

export default SourcesHealthTable;

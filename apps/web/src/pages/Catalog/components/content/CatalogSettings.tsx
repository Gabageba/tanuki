import { useEffect, useState } from 'react';
import { Button, Grid, Group, SegmentedControl, Select, Stack, Text } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { useSearchParams } from 'react-router';
import {
  CaretDownIcon,
  CaretUpIcon,
  FunnelIcon,
  RowsIcon,
  SquaresFourIcon,
} from '@phosphor-icons/react';
import PageLayout from '@/shared/ui/PageLayout';
import type { FilterSelection, SortOrder } from '@tanuki/contracts';
import useSource from '@/entities/source/hooks/useSource';
import { getSortOrderLabel, resolveOrder } from '../../utils/sortOrder';
import { serializeFilters } from '../../utils/filterSelection';
import type { CatalogParams } from '../../models';
import useFilters from '../../hooks/useFilters';
import CatalogFilterPills from '../filters/CatalogFilterPills';
import CatalogFilterCard from '../filters/CatalogFilterCard';
import CatalogFilterDrawer from '../filters/CatalogFilterDrawer';
import CatalogSettingsSkeleton from './CatalogSettingsSkeleton';

type Props = {
  sourceId: string | undefined;
};

function CatalogSettings({ sourceId }: Props) {
  const { data: source, isLoading: isSourceLoading } = useSource({ sourceId });
  const { data: filters, isLoading: isFiltersLoading } = useFilters({ sourceId });
  const { params, setParams } = PageLayout.useParams<CatalogParams>();
  const [, setSearchParams] = useSearchParams();

  const [isFilterOpened, setIsFilterOpened] = useState(false);
  // Drawer скрыт на десктопе только через hiddenFrom (CSS), но Mantine всё равно блокирует
  // скролл страницы (RemoveScroll), пока opened=true — из-за этого не крутится колесом
  // ScrollArea в десктопной CatalogFilterCard. Открываем Drawer только на мобильном вьюпорте.
  const isMobile = useMediaQuery('(max-width: 47.9375em)', false);

  const order = resolveOrder(params.order, source);

  // Сортировка не может отсутствовать в урле — как только источник подгрузился и мы знаем
  // сортировку по умолчанию (params.order ещё не задан явно), сразу закрепляем её в урле.
  useEffect(() => {
    if (params.order || !order) return;
    setParams({ ...params, order });
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('order', order);
        return next;
      },
      { replace: true },
    );
  }, [order, params, setParams, setSearchParams]);

  const handleOrderChange = (order: SortOrder) => {
    setParams({ ...params, order });
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('order', order);
        return next;
      },
      { replace: true },
    );
  };

  const handleFiltersChange = (next: FilterSelection[]) => {
    setParams({ ...params, filters: next });
    setSearchParams(
      (prev) => {
        const nextParams = new URLSearchParams(prev);
        nextParams.delete('filters');
        for (const value of serializeFilters(next)) {
          nextParams.append('filters', value);
        }
        return nextParams;
      },
      { replace: true },
    );
  };

  if (!sourceId || isSourceLoading || isFiltersLoading) {
    return <CatalogSettingsSkeleton />;
  }

  return (
    <Stack gap="xs" w="100%" mb="md">
      <Grid gap="sm">
        <Grid.Col span={{ base: 12, xs: 'auto' }} order={1}>
          {!!filters?.groups.length && !params.query && (
            <Button
              w={{ base: '100%', xs: 'auto' }}
              leftSection={<FunnelIcon />}
              rightSection={isFilterOpened ? <CaretUpIcon /> : <CaretDownIcon />}
              onClick={() => setIsFilterOpened((prev) => !prev)}
              style={{ alignSelf: 'flex-start' }}
            >
              <Text>Фильтры</Text>
            </Button>
          )}
        </Grid.Col>
        <Grid.Col span={{ base: 12, xs: 'content' }} order={{ base: 3, xs: 2 }}>
          <Group gap="xs">
            {!!source?.sortOrders.length && !params.query && (
              <Select
                data={source.sortOrders.map((value) => ({
                  value,
                  label: getSortOrderLabel(value),
                }))}
                value={order ?? null}
                onChange={(value) => handleOrderChange(value as SortOrder)}
                placeholder="Сортировка"
                allowDeselect={false}
                w={200}
                floatingHeight="viewport"
                flex={{ base: 1, sm: 'none' }}
              />
            )}
            <SegmentedControl
              data={[
                { label: <RowsIcon size={18} />, value: 'rows' },
                { label: <SquaresFourIcon size={18} />, value: 'squares' },
              ]}
            />
          </Group>
        </Grid.Col>
        {!params.query && (
          <CatalogFilterPills
            selection={params.filters ?? []}
            groups={filters?.groups}
            onChange={handleFiltersChange}
          />
        )}
      </Grid>
      {isFilterOpened && filters?.groups.length && (
        <CatalogFilterCard
          groups={filters.groups}
          selection={params.filters ?? []}
          onClose={() => setIsFilterOpened(false)}
          onChange={handleFiltersChange}
        />
      )}
      <CatalogFilterDrawer
        groups={filters?.groups ?? []}
        selection={params.filters ?? []}
        opened={isFilterOpened && isMobile}
        onClose={() => setIsFilterOpened(false)}
        onChange={handleFiltersChange}
      />
    </Stack>
  );
}

export default CatalogSettings;

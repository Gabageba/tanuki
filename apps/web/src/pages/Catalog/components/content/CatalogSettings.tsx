import { useEffect, useState } from 'react';
import { Button, Grid, Group, Stack, Text } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { useSearchParams } from 'react-router';
import { CaretDownIcon, CaretUpIcon, FunnelIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import PageLayout from '@/shared/ui/PageLayout';
import { SORT_DIRECTION, type FilterSelection } from '@tanuki/contracts';
import useSource from '@/entities/source/hooks/useSource';
import { resolveEffectiveSortOrders, resolveOrder } from '../../utils/sortOrder';
import { serializeFilters } from '../../utils/filterSelection';
import type { CatalogParams } from '../../models';
import useFilters from '../../hooks/useFilters';
import CatalogFilterPills from '../filters/CatalogFilterPills';
import CatalogFilterCard from '../filters/CatalogFilterCard';
import CatalogFilterDrawer from '../filters/CatalogFilterDrawer';
import CatalogSettingsSkeleton from './CatalogSettingsSkeleton';
import CatalogSort from './CatalogSort';
import CatalogViewMode from './CatalogViewMode';

type Props = {
  sourceId: string | undefined;
};

function CatalogSettings({ sourceId }: Props) {
  const { t } = useTranslation();
  const { data: source, isPending: isSourcePending } = useSource({ sourceId });
  const { data: filters, isPending: isFiltersPending } = useFilters({ sourceId });
  const { params, setParams } = PageLayout.useParams<CatalogParams>();
  const [, setSearchParams] = useSearchParams();

  const [isFilterOpened, setIsFilterOpened] = useState(false);
  // Drawer скрыт на десктопе только через hiddenFrom (CSS), но Mantine всё равно блокирует
  // скролл страницы (RemoveScroll), пока opened=true — из-за этого не крутится колесом
  // ScrollArea в десктопной CatalogFilterCard. Открываем Drawer только на мобильном вьюпорте.
  const isMobile = useMediaQuery('(max-width: 47.9375em)', false);

  const { sortOrders: effectiveSortOrders, supportsDirection: effectiveSupportsDirection } =
    resolveEffectiveSortOrders(source, filters?.groups, params.filters);
  const order = resolveOrder(params.order, effectiveSortOrders);
  const direction = params.direction ?? SORT_DIRECTION.DESC;

  // Сортировка (и направление, если источник его поддерживает) не может отсутствовать в урле
  // и не может остаться той, что недоступна для активного фильтра (см.
  // resolveEffectiveSortOrders) — как только источник/фильтры подгрузились, сразу закрепляем
  // актуальные значения в урле. Оба поля обновляются одним setParams/setSearchParams, чтобы не
  // потерять одно изменение из-за того, что setParams — обычный useState-сеттер, а не
  // функциональный.
  useEffect(() => {
    const needsOrder = order !== undefined && params.order !== order;
    const needsDirection = effectiveSupportsDirection && !params.direction;
    if (!needsOrder && !needsDirection) return;

    setParams({
      ...params,
      ...(needsOrder && { order }),
      ...(needsDirection && { direction }),
    });
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (needsOrder) next.set('order', order);
        if (needsDirection) next.set('direction', direction);
        return next;
      },
      { replace: true },
    );
  }, [order, direction, params, effectiveSupportsDirection, setParams, setSearchParams]);

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

  if (!sourceId || isSourcePending || isFiltersPending) {
    return <CatalogSettingsSkeleton />;
  }

  return (
    <Stack gap="xs" w="100%" mb="md">
      <Grid gap="sm">
        <Grid.Col span={{ base: 12, xs: 'auto' }} order={1}>
          {!!filters?.groups.length && (
            <Button
              w={{ base: '100%', xs: 'auto' }}
              leftSection={<FunnelIcon />}
              rightSection={isFilterOpened ? <CaretUpIcon /> : <CaretDownIcon />}
              onClick={() => setIsFilterOpened((prev) => !prev)}
              style={{ alignSelf: 'flex-start' }}
            >
              <Text>{t('filters')}</Text>
            </Button>
          )}
        </Grid.Col>
        <Grid.Col span={{ base: 12, xs: 'content' }} order={{ base: 3, xs: 2 }}>
          <Group gap="xs">
            <CatalogSort
              sortOrders={effectiveSortOrders}
              supportsDirection={effectiveSupportsDirection}
            />
            <CatalogViewMode />
          </Group>
        </Grid.Col>
        <CatalogFilterPills
          selection={params.filters ?? []}
          groups={filters?.groups}
          onChange={handleFiltersChange}
        />
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

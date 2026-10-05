import { useState } from 'react';
import { Group, Stack, Title } from '@mantine/core';
import { SORT_DIRECTION, type SourceContentType, type SourceStatus } from '@tanuki/contracts';
import { sortSources, toggleSort } from '../lib';
import { MOCK_SOURCES } from '../mocks';
import {
  DEMO_STATE,
  HEALTH_SORT,
  TABLE_LAYOUT,
  VIEWER,
  type DemoState,
  type DrawerLayout,
  type MockSource,
  type SortState,
  type TableLayout,
  type Viewer,
} from '../models';
import HealthDrawer from './HealthDrawer';
import HealthFilters from './HealthFilters';
import HealthList from './HealthList';
import ProbeButton from './ProbeButton';

type Props = {
  layout: TableLayout;
  drawerLayout: DrawerLayout;
  viewer: Viewer;
  demoState: DemoState;
};

const DEFAULT_SORT: SortState = { sort: HEALTH_SORT.STATUS, direction: SORT_DIRECTION.ASC };

/** Страница целиком: шапка с «Проверить все» (у персонала), фильтры, таблица и карточка. */
function HealthDemo({ layout, drawerLayout, viewer, demoState }: Props) {
  const [status, setStatus] = useState<SourceStatus[]>([]);
  const [contentType, setContentType] = useState<SourceContentType[]>([]);
  const [sortState, setSortState] = useState<SortState>(DEFAULT_SORT);
  const [openedId, setOpenedId] = useState<string | null>(null);

  const isCurrent = layout === TABLE_LAYOUT.CURRENT;
  const filtered =
    demoState === DEMO_STATE.EMPTY
      ? []
      : MOCK_SOURCES.filter(
          (source) =>
            (!status.length || status.includes(source.status)) &&
            (!contentType.length || contentType.includes(source.contentType)),
        );
  const sources = isCurrent
    ? sortSources(MOCK_SOURCES, DEFAULT_SORT)
    : sortSources(filtered, sortState);
  const opened = MOCK_SOURCES.find((source) => source.id === openedId) ?? null;

  const resetFilters = () => {
    setStatus([]);
    setContentType([]);
  };

  return (
    <Stack gap="md">
      <Group justify="space-between" wrap="nowrap">
        <Title order={3}>Здоровье источников</Title>
        {(isCurrent || viewer === VIEWER.STAFF) && <ProbeButton label="Проверить все" />}
      </Group>
      {!isCurrent && (
        <HealthFilters
          status={status}
          contentType={contentType}
          onStatusChange={setStatus}
          onContentTypeChange={setContentType}
        />
      )}
      <HealthList
        sources={sources}
        layout={layout}
        demoState={demoState}
        sortState={sortState}
        onSortChange={(sort) => setSortState((current) => toggleSort(current, sort))}
        onOpen={(source: MockSource) => setOpenedId(source.id)}
        onReset={resetFilters}
      />
      <HealthDrawer
        source={opened}
        layout={drawerLayout}
        viewer={viewer}
        onClose={() => setOpenedId(null)}
      />
    </Stack>
  );
}

export default HealthDemo;

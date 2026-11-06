import { useMemo, useState } from 'react';
import { Box, Button, Group, Stack, Tabs } from '@mantine/core';
import { BooksIcon, FireIcon, SparkleIcon } from '@phosphor-icons/react';
import { generatePath, Link } from 'react-router';
import { SORT_ORDER, VIEW_MODE, type ViewMode } from '@tanuki/contracts';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import ViewModeSwitch from '@/shared/ui/ViewModeSwitch';
import {
  CARD_DENSITY,
  FEED_STATE,
  PANEL_LAYOUT,
  SECTION,
  type CardDensity,
  type AgeBadgePosition,
  type Example,
  type FeedState,
  type FolderDecoration,
  type PanelLayout,
  type PopularOrder,
  type Section,
} from '../models';
import { MONTHS, SOURCE } from '../mocks';
import CoverlessPanel from './CoverlessPanel';
import CoverlessFeed from './CoverlessFeed';
import OrdinaryFeed from './OrdinaryFeed';
import SelectionsSourcePicker from './SelectionsSourcePicker';

type Props = {
  examples: Example[];
  phone: boolean;
  layout?: PanelLayout;
  state?: FeedState;
  density?: CardDensity;
  columns?: number;
  folderDecoration?: FolderDecoration;
  ageBadgePosition?: AgeBadgePosition;
};

function SelectionsPreview({
  examples,
  phone,
  layout = PANEL_LAYOUT.ROW,
  state = FEED_STATE.READY,
  density = CARD_DENSITY.SHORT,
  columns = 1,
  folderDecoration,
  ageBadgePosition,
}: Props) {
  const [section, setSection] = useState<Section>(SECTION.POPULAR);
  const [month, setMonth] = useState(MONTHS[0]!.value);
  const [order, setOrder] = useState<PopularOrder>(SORT_ORDER.LIKES);
  const [viewMode, setViewMode] = useState<ViewMode>(VIEW_MODE.GRID);
  const [retried, setRetried] = useState(false);
  const effectiveState = retried ? FEED_STATE.READY : state;
  const monthIndex = MONTHS.findIndex(({ value }) => value === month);
  const monthExamples = examples.slice(0, Math.max(1, examples.length - monthIndex));
  const sortedExamples = [...monthExamples].sort((a, b) => {
    switch (order) {
      case SORT_ORDER.LIKES:
        return (b.title.likes ?? -1) - (a.title.likes ?? -1);
      case SORT_ORDER.VIEWS:
        return (b.title.views ?? -1) - (a.title.views ?? -1);
    }
  });
  const TABS = useMemo(
    () => [
      {
        id: SECTION.POPULAR,
        title: 'Популярные',
        icon: <FireIcon />,
        content: (
          <Stack gap="md" pt="md">
            <CoverlessPanel
              phone={phone}
              layout={layout}
              month={month}
              order={order}
              onMonthChange={(value) => {
                setMonth(value);
                if (state === FEED_STATE.EMPTY) setRetried(true);
              }}
              onOrderChange={(value) => {
                setOrder(value);
                if (state === FEED_STATE.EMPTY) setRetried(true);
              }}
            />
            <CoverlessFeed
              phone={phone}
              examples={sortedExamples}
              state={effectiveState}
              density={density}
              columns={columns}
              folderDecoration={folderDecoration}
              ageBadgePosition={ageBadgePosition}
              onRetry={() => setRetried(true)}
            />
          </Stack>
        ),
      },
      {
        id: SECTION.NEW,
        title: 'Новые переводы',
        icon: <SparkleIcon />,
        content: (
          <Stack gap="md" pt="md">
            <Group justify="flex-end">
              <ViewModeSwitch value={viewMode} onChange={setViewMode} />
            </Group>
            <OrdinaryFeed phone={phone} examples={examples} viewMode={viewMode} />
          </Stack>
        ),
      },
    ],
    [
      phone,
      layout,
      month,
      order,
      sortedExamples,
      effectiveState,
      density,
      columns,
      folderDecoration,
      ageBadgePosition,
      viewMode,
      examples,
      state,
    ],
  );

  return (
    <Stack gap="md">
      <Group justify="space-between" wrap="nowrap" gap="sm">
        <Box flex={1} miw={0}>
          <SelectionsSourcePicker />
        </Box>
        <Button
          component={Link}
          to={generatePath(ROUTE_PATHS.CATALOG, { sourceId: SOURCE.id })}
          variant="default"
          leftSection={<BooksIcon />}
          flex="none"
        >
          Каталог
        </Button>
      </Group>
      {effectiveState === FEED_STATE.UNAVAILABLE || effectiveState === FEED_STATE.LOCKED ? (
        <CoverlessFeed
          phone={phone}
          examples={examples}
          state={effectiveState}
          onRetry={() => setRetried(true)}
        />
      ) : (
        <Tabs
          value={section}
          onChange={(value) => {
            switch (value) {
              case SECTION.POPULAR:
              case SECTION.NEW:
                setSection(value);
            }
          }}
        >
          <Tabs.List>
            {TABS.map(({ id, title, icon }) => (
              <Tabs.Tab key={id} value={id} leftSection={icon}>
                {title}
              </Tabs.Tab>
            ))}
          </Tabs.List>
          {TABS.map(({ id, content }) => (
            <Tabs.Panel key={id} value={id}>
              {content}
            </Tabs.Panel>
          ))}
        </Tabs>
      )}
    </Stack>
  );
}

export default SelectionsPreview;

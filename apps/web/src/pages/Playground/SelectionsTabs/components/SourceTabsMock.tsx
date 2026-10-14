import { use, useRef, useState } from 'react';
import { Box, Group, Scroller, Select, Stack, Tabs } from '@mantine/core';
import SourceIcon from '@/entities/source/components/SourceIcon';
import { VIEW_MODE, type ViewMode } from '@/shared/lib/viewMode';
import { PHONE_FRAME_CONTEXT } from '../../Bookmarks/models';
import { getBlockKindIcon } from '../lib';
import { MOCK_SELECTIONS } from '../mocks';
import { BASE_LOOK, FEED_STATE } from '../models';
import BlockFeed from './BlockFeed';
import CatalogViewControls from './CatalogViewControls';
import PageTitleMock from './PageTitleMock';
import ScrollWindow from './ScrollWindow';

/**
 * R2 — наоборот: источники вкладками с логотипами (листаются вбок), блок выбирается полем
 * `Select` с иконкой его вида, под ним та же сетка с подгрузкой.
 */
function SourceTabsMock() {
  const isPhone = use(PHONE_FRAME_CONTEXT);
  const [sourceId, setSourceId] = useState(MOCK_SELECTIONS[0]?.source.id ?? '');
  const [blockId, setBlockId] = useState<string | undefined>();
  const [viewMode, setViewMode] = useState<ViewMode>(VIEW_MODE.GRID);
  const loadMoreRef = useRef<(() => void) | null>(null);

  const entry = MOCK_SELECTIONS.find(({ source }) => source.id === sourceId);
  if (!entry) return null;
  const block = entry.blocks.find(({ id }) => id === blockId) ?? entry.blocks[0];
  if (!block) return null;

  const blockSelect = (
    <Select
      aria-label="Блок"
      data={entry.blocks.map(({ id, title }) => ({ value: id, label: title }))}
      value={block.id}
      onChange={(value) => value && setBlockId(value)}
      allowDeselect={false}
      leftSection={getBlockKindIcon(block.kind)}
      w={isPhone ? '100%' : 320}
    />
  );

  return (
    <ScrollWindow onBottomReached={() => loadMoreRef.current?.()}>
      <Stack gap="lg">
        <PageTitleMock />
        <Tabs
          value={sourceId}
          onChange={(value) => {
            if (!value) return;
            setSourceId(value);
            setBlockId(undefined);
          }}
        >
          <Tabs.List style={{ flexWrap: 'nowrap' }}>
            <Box flex={1} miw={0}>
              <Scroller>
                <Group gap={0} wrap="nowrap">
                  {MOCK_SELECTIONS.map(({ source }) => (
                    <Tabs.Tab
                      key={source.id}
                      value={source.id}
                      leftSection={
                        <SourceIcon id={source.id} title={source.title} size={20} radius="sm" />
                      }
                    >
                      {source.title}
                    </Tabs.Tab>
                  ))}
                </Group>
              </Scroller>
            </Box>
          </Tabs.List>
        </Tabs>
        {isPhone ? (
          <Stack gap="md">
            {blockSelect}
            <CatalogViewControls
              source={entry.source}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />
          </Stack>
        ) : (
          <Group justify="space-between" wrap="nowrap">
            {blockSelect}
            <CatalogViewControls
              source={entry.source}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />
          </Group>
        )}
        <BlockFeed
          key={`${entry.source.id}:${block.id}`}
          source={entry.source}
          block={block}
          state={FEED_STATE.LIVE}
          viewMode={viewMode}
          end={BASE_LOOK.end}
          nextPageError={BASE_LOOK.nextPageError}
          onLoadMoreChange={(loadMore) => {
            loadMoreRef.current = loadMore;
          }}
        />
      </Stack>
    </ScrollWindow>
  );
}

export default SourceTabsMock;

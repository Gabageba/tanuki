import { use, useState } from 'react';
import { Box, Group, Stack, Text } from '@mantine/core';
import { generatePath } from 'react-router';
import SourceTitle from '@/entities/source/components/SourceTitle';
import TitleCardsScroller from '@/entities/title/card/TitleCardsScroller';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import ArrowLink from '@/shared/ui/ArrowLink';
import { PHONE_FRAME_CONTEXT } from '../../Bookmarks/models';
import { makeBlockPage, MOCK_SELECTIONS } from '../mocks';
import PageTitleMock from './PageTitleMock';
import ScrollWindow from './ScrollWindow';
import SourceChipsPicker from './SourceChipsPicker';

/** Закладок на карточках в макете нет. */
const getNoBookmarkFolder = () => null;

/** R0 — как сейчас: чипы, заголовок источника и все его блоки лентами, у каждой только то, что
 *  лежит на главной сайта. */
function CurrentSelectionsMock() {
  const isPhone = use(PHONE_FRAME_CONTEXT);
  const [sourceId, setSourceId] = useState(MOCK_SELECTIONS[0]?.source.id ?? '');
  const entry = MOCK_SELECTIONS.find(({ source }) => source.id === sourceId);
  if (!entry) return null;
  const catalogLink = (
    <ArrowLink to={generatePath(ROUTE_PATHS.CATALOG, { sourceId: entry.source.id })}>
      Каталог: {entry.source.title}
    </ArrowLink>
  );

  return (
    <ScrollWindow onBottomReached={() => undefined}>
      <Stack gap="lg">
        <PageTitleMock />
        <SourceChipsPicker
          sources={MOCK_SELECTIONS.map(({ source }) => source)}
          activeId={sourceId}
          onChange={setSourceId}
        />
        <Stack gap="md">
          <Group justify="space-between" wrap="nowrap" gap="sm">
            <Box miw={0}>
              <SourceTitle source={entry.source} />
            </Box>
            {!isPhone && catalogLink}
          </Group>
          {isPhone && catalogLink}
          <Stack gap="lg">
            {entry.blocks.map((block) => (
              <Stack key={block.id} gap="xs" miw={0}>
                <Text fz="sm" fw={600} lh="tight">
                  {block.title}
                </Text>
                <TitleCardsScroller
                  items={makeBlockPage(entry.source, block, 0)}
                  getBookmarkFolder={getNoBookmarkFolder}
                />
              </Stack>
            ))}
          </Stack>
        </Stack>
      </Stack>
    </ScrollWindow>
  );
}

export default CurrentSelectionsMock;

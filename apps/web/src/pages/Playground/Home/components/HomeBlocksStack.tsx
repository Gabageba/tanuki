import { useContext } from 'react';
import { SimpleGrid, Stack } from '@mantine/core';
import { PHONE_FRAME_CONTEXT } from '../../Bookmarks/models';
import { groupBlockRows } from '../lib';
import type { HomeBlock, ShortBlocks } from '../models';
import HomeBlockRibbon from './HomeBlockRibbon';

type Props = {
  blocks: HomeBlock[];
  shortBlocks: ShortBlocks;
};

/** Блоки источника столбиком: заголовок блока и его лента. */
function HomeBlocksStack({ blocks, shortBlocks }: Props) {
  const isPhone = useContext(PHONE_FRAME_CONTEXT);
  const rows = groupBlockRows(blocks, shortBlocks, isPhone);

  return (
    <Stack gap="lg">
      {rows.map((row) => (
        <SimpleGrid key={row.map(({ id }) => id).join()} cols={row.length} spacing="xl">
          {row.map((block) => (
            <HomeBlockRibbon key={block.id} block={block} />
          ))}
        </SimpleGrid>
      ))}
    </Stack>
  );
}

export default HomeBlocksStack;

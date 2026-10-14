import { Box, Scroller, SegmentedControl, Stack } from '@mantine/core';
import CardsScroller from '../../TitleSearch/components/CardsScroller';
import useActiveBlock from '../hooks/useActiveBlock';
import type { HomeBlock } from '../models';

type Props = {
  blocks: HomeBlock[];
};

/** S2a — блоки в `SegmentedControl`: выбранный выделен подложкой. Не влез — листается. */
function HomeBlocksSegmented({ blocks }: Props) {
  const { activeBlock, setActiveId } = useActiveBlock(blocks);

  if (!activeBlock) {
    return null;
  }

  return (
    <Stack gap="sm">
      <Scroller>
        <Box w="max-content">
          <SegmentedControl
            size="sm"
            value={activeBlock.id}
            onChange={setActiveId}
            data={blocks.map((block) => ({ value: block.id, label: block.title }))}
          />
        </Box>
      </Scroller>
      <CardsScroller items={activeBlock.items} />
    </Stack>
  );
}

export default HomeBlocksSegmented;

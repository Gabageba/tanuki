import { Chip, Group, Scroller, Stack, Text } from '@mantine/core';
import CardsScroller from '../../TitleSearch/components/CardsScroller';
import useActiveBlock from '../hooks/useActiveBlock';
import type { HomeBlock } from '../models';

type Props = {
  blocks: HomeBlock[];
  /** S2e — у активного чипа число тайтлов в блоке. */
  withCount?: boolean;
};

/** S2 — блоки источника переключаются чипами, лента одна. Чипы листаются, если не влезли. */
function HomeBlocksTabs({ blocks, withCount = false }: Props) {
  const { activeBlock, setActiveId } = useActiveBlock(blocks);

  if (!activeBlock) {
    return null;
  }

  return (
    <Stack gap="sm">
      <Scroller>
        <Chip.Group value={activeBlock.id} onChange={setActiveId}>
          <Group gap="xs" wrap="nowrap">
            {blocks.map((block) => (
              <Chip key={block.id} value={block.id} size="sm" variant="outline">
                {block.title}
                {withCount && block.id === activeBlock.id && (
                  <Text span inherit ff="monospace" c="dimmed" ml={6}>
                    {block.items.length}
                  </Text>
                )}
              </Chip>
            ))}
          </Group>
        </Chip.Group>
      </Scroller>
      <CardsScroller items={activeBlock.items} />
    </Stack>
  );
}

export default HomeBlocksTabs;

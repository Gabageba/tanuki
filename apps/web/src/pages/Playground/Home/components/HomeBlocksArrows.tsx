import { ActionIcon, Group, Stack, Text } from '@mantine/core';
import { CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react';
import CardsScroller from '../../TitleSearch/components/CardsScroller';
import useActiveBlock from '../hooks/useActiveBlock';
import type { HomeBlock } from '../models';

type Props = {
  blocks: HomeBlock[];
};

/** S2d — название открытого блока между стрелками ‹ ›, листает по кругу; рядом «2/6». */
function HomeBlocksArrows({ blocks }: Props) {
  const { activeBlock, activeIndex, setActiveId } = useActiveBlock(blocks);

  if (!activeBlock) {
    return null;
  }

  const go = (shift: number) => {
    const next = blocks[(activeIndex + shift + blocks.length) % blocks.length];
    if (next) setActiveId(next.id);
  };

  return (
    <Stack gap="sm">
      <Group gap={4} wrap="nowrap">
        <ActionIcon
          variant="subtle"
          color="gray"
          size="sm"
          aria-label="Предыдущая подборка"
          onClick={() => go(-1)}
        >
          <CaretLeftIcon />
        </ActionIcon>
        <Text fz="sm" fw={600} lh="tight" truncate>
          {activeBlock.title}
        </Text>
        <ActionIcon
          variant="subtle"
          color="gray"
          size="sm"
          aria-label="Следующая подборка"
          onClick={() => go(1)}
        >
          <CaretRightIcon />
        </ActionIcon>
        <Text fz="xs" c="dimmed" ff="monospace" flex="none">
          {activeIndex + 1}/{blocks.length}
        </Text>
      </Group>
      <CardsScroller items={activeBlock.items} />
    </Stack>
  );
}

export default HomeBlocksArrows;

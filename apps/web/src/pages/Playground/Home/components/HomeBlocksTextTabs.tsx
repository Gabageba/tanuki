import { Group, Scroller, Stack, Text, UnstyledButton } from '@mantine/core';
import CardsScroller from '../../TitleSearch/components/CardsScroller';
import useActiveBlock from '../hooks/useActiveBlock';
import type { HomeBlock } from '../models';

type Props = {
  blocks: HomeBlock[];
};

/** S2b — как на главных сайтов: названия блоков строкой текста, активное — обычным цветом и
 *  подчёркнуто, остальные приглушены. Общая тонкая линия под строкой. */
function HomeBlocksTextTabs({ blocks }: Props) {
  const { activeBlock, setActiveId } = useActiveBlock(blocks);

  if (!activeBlock) {
    return null;
  }

  return (
    <Stack gap="sm">
      <Scroller>
        <Group
          gap="lg"
          wrap="nowrap"
          style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}
        >
          {blocks.map((block) => {
            const isActive = block.id === activeBlock.id;
            return (
              <UnstyledButton
                key={block.id}
                onClick={() => setActiveId(block.id)}
                aria-pressed={isActive}
                pb={8}
                mb={-1}
                style={{
                  borderBottom: `2px solid ${isActive ? 'var(--mantine-primary-color-filled)' : 'transparent'}`,
                }}
              >
                <Text
                  fz="sm"
                  fw={600}
                  c={isActive ? undefined : 'dimmed'}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  {block.title}
                </Text>
              </UnstyledButton>
            );
          })}
        </Group>
      </Scroller>
      <CardsScroller items={activeBlock.items} />
    </Stack>
  );
}

export default HomeBlocksTextTabs;

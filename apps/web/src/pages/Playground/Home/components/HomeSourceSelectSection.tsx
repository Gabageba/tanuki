import { useContext } from 'react';
import { Box, Group, Select, Stack } from '@mantine/core';
import { StackIcon } from '@phosphor-icons/react';
import SourceTitle from '@/entities/source/components/SourceTitle';
import CardsScroller from '../../TitleSearch/components/CardsScroller';
import { PHONE_FRAME_CONTEXT } from '../../Bookmarks/models';
import useActiveBlock from '../hooks/useActiveBlock';
import type { HomeSource } from '../models';
import CatalogLink from './CatalogLink';

type Props = {
  home: HomeSource;
};

/** S2c — блок выбирается дропдауном в строке заголовка источника, лента одна. На телефоне поле
 *  не влезает рядом с названием и уходит под него. */
function HomeSourceSelectSection({ home: { source, blocks } }: Props) {
  const isPhone = useContext(PHONE_FRAME_CONTEXT);
  const { activeBlock, setActiveId } = useActiveBlock(blocks);

  if (!activeBlock) {
    return null;
  }

  const select = (
    <Select
      aria-label={`Подборка ${source.title}`}
      leftSection={<StackIcon />}
      data={blocks.map((block) => ({ value: block.id, label: block.title }))}
      value={activeBlock.id}
      onChange={(value) => value && setActiveId(value)}
      allowDeselect={false}
      w={isPhone ? '100%' : 240}
      flex="none"
    />
  );

  return (
    <Stack gap="md">
      <Group justify="space-between" wrap="nowrap" gap="sm">
        <Box miw={0} flex={1}>
          <SourceTitle source={source} />
        </Box>
        {!isPhone && select}
        <CatalogLink source={source} />
      </Group>
      {isPhone && select}
      <CardsScroller items={activeBlock.items} />
    </Stack>
  );
}

export default HomeSourceSelectSection;

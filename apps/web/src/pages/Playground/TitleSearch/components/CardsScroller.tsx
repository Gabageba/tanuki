import { useContext } from 'react';
import { Box, Group, Scroller } from '@mantine/core';
import type { Title } from '@tanuki/contracts';
import SourceTitleCard from '@/entities/source/components/SourceTitleCard/SourceTitleCard';
import { PHONE_FRAME_CONTEXT } from '../../Bookmarks/models';

type Props = {
  items: Title[];
};

/** L1s — лента на `Scroller`: у краёв стрелки с затуханием в фон, мышью ленту можно тянуть. */
function CardsScroller({ items }: Props) {
  const isPhone = useContext(PHONE_FRAME_CONTEXT);

  return (
    <Scroller>
      <Group gap="md" wrap="nowrap" align="flex-start">
        {items.map((title) => (
          <Box key={title.id} w={isPhone ? 128 : 168} flex="none">
            <SourceTitleCard title={title} />
          </Box>
        ))}
      </Group>
    </Scroller>
  );
}

export default CardsScroller;

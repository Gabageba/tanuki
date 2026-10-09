import { useContext } from 'react';
import { Box, Group, ScrollArea } from '@mantine/core';
import type { Title } from '@tanuki/contracts';
import TitleCard from '@/entities/title/card/TitleCard';
import { PHONE_FRAME_CONTEXT } from '../../Bookmarks/models';

type Props = {
  items: Title[];
};

/** Лента: один ряд обложек фиксированной ширины, остальное — горизонтальной прокруткой. */
function CardsRibbon({ items }: Props) {
  const isPhone = useContext(PHONE_FRAME_CONTEXT);

  return (
    <ScrollArea type="auto" scrollbarSize={6} offsetScrollbars="x">
      <Group gap="md" wrap="nowrap" align="flex-start" pb={4}>
        {items.map((title) => (
          <Box key={title.id} w={isPhone ? 128 : 168} flex="none">
            <TitleCard title={title} />
          </Box>
        ))}
      </Group>
    </ScrollArea>
  );
}

export default CardsRibbon;

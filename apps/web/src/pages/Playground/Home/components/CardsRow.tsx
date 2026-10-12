import { useContext, type ReactNode } from 'react';
import { Box, Group, Scroller } from '@mantine/core';
import { PHONE_FRAME_CONTEXT } from '../../Bookmarks/models';

type Props = {
  /** Ширина карточки на десктопе; на телефоне — на 40 px уже. */
  width?: number;
  items: { key: string; node: ReactNode }[];
};

/** Лента на `Scroller` с карточками заданной ширины — для блоков главной оси W. */
function CardsRow({ width = 168, items }: Props) {
  const isPhone = useContext(PHONE_FRAME_CONTEXT);
  const cardWidth = isPhone ? width - 40 : width;

  return (
    <Scroller>
      <Group gap="md" wrap="nowrap" align="flex-start">
        {items.map(({ key, node }) => (
          <Box key={key} w={cardWidth} flex="none">
            {node}
          </Box>
        ))}
      </Group>
    </Scroller>
  );
}

export default CardsRow;

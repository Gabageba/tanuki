import { useContext } from 'react';
import { Box, Group } from '@mantine/core';
import TitleGridCardSkeleton from '@/entities/title/card/TitleGridCard/TitleGridCardSkeleton';
import { PHONE_FRAME_CONTEXT } from '../../Bookmarks/models';

/** Сколько карточек рисует лента скелетона: больше, чем влезает на десктопе, — край обрезается. */
const SKELETON_CARDS = 8;

/** Лента обложек-скелетонов той же ширины, что настоящая. */
function RibbonSkeleton() {
  const isPhone = useContext(PHONE_FRAME_CONTEXT);

  return (
    <Group gap="md" wrap="nowrap" style={{ overflow: 'hidden' }}>
      {Array.from({ length: SKELETON_CARDS }, (_, index) => (
        <Box key={index} w={isPhone ? 128 : 168} flex="none">
          <TitleGridCardSkeleton />
        </Box>
      ))}
    </Group>
  );
}

export default RibbonSkeleton;

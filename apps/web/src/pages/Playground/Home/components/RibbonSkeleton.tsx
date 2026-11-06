import { useContext } from 'react';
import { Box, Group } from '@mantine/core';
import { VIEW_MODE } from '@tanuki/contracts';
import SourceTitleCardSkeleton from '@/entities/source/components/SourceTitleCard/SourceTitleCardSkeleton';
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
          <SourceTitleCardSkeleton viewMode={VIEW_MODE.GRID} />
        </Box>
      ))}
    </Group>
  );
}

export default RibbonSkeleton;

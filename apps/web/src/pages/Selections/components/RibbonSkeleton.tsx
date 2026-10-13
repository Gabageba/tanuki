import { Box, Group } from '@mantine/core';
import TitleGridCardSkeleton from '@/entities/title/card/TitleGridCard/TitleGridCardSkeleton';

/** Сколько карточек рисует лента скелетона: больше, чем влезает на десктопе, — край обрезается. */
const SKELETON_CARDS = 8;

/** Лента карточек-скелетонов той же ширины, что настоящая. */
function RibbonSkeleton() {
  return (
    <Group gap="md" wrap="nowrap" style={{ overflow: 'hidden' }}>
      {Array.from({ length: SKELETON_CARDS }, (_, index) => (
        <Box key={index} w={{ base: 128, sm: 168 }} flex="none">
          <TitleGridCardSkeleton />
        </Box>
      ))}
    </Group>
  );
}

export default RibbonSkeleton;

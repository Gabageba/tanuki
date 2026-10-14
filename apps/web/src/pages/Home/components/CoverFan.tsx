import { AspectRatio, Box, Group } from '@mantine/core';
import type { Title } from '@tanuki/contracts';
import CoverImage from '@/shared/ui/CoverImage';
import { FAN_ROTATIONS } from '../models';

type Props = {
  titles: Title[];
};

/** Ширина обложки веера и насколько соседние заходят друг на друга. */
const COVER_WIDTH = 44;
const COVER_OVERLAP = 14;

/** Веер из трёх обложек на плитке «Подборки». Обложек нет — нет и веера. */
function CoverFan({ titles }: Props) {
  if (titles.length === 0) {
    return null;
  }

  return (
    <Group gap={0} wrap="nowrap" flex="none" pr="xs">
      {titles.slice(0, FAN_ROTATIONS.length).map((title, index) => (
        <Box
          key={title.id}
          w={COVER_WIDTH}
          ml={index === 0 ? 0 : -COVER_OVERLAP}
          style={{ transform: `rotate(${FAN_ROTATIONS[index] ?? 0}deg)` }}
        >
          <AspectRatio ratio={3 / 4}>
            <Box bdrs="sm" style={{ overflow: 'hidden' }}>
              <CoverImage src={title.coverUrl} alt={title.name} />
            </Box>
          </AspectRatio>
        </Box>
      ))}
    </Group>
  );
}

export default CoverFan;

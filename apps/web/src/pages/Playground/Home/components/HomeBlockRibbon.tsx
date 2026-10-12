import { Stack, Text } from '@mantine/core';
import CardsScroller from '../../TitleSearch/components/CardsScroller';
import type { HomeBlock } from '../models';

type Props = {
  block: HomeBlock;
};

/** Блок с главной сайта: его название — ступенью ниже названия источника (14 полужирный против
 *  заголовка h5), под ним лента обложек, как в поиске. */
function HomeBlockRibbon({ block }: Props) {
  return (
    <Stack gap="xs" miw={0}>
      <Text fz="sm" fw={600} lh="tight">
        {block.title}
      </Text>
      <CardsScroller items={block.items} />
    </Stack>
  );
}

export default HomeBlockRibbon;

import { Stack, Text } from '@mantine/core';
import SourceTitleSkeleton from '@/entities/source/components/SourceTitle/SourceTitleSkeleton';
import type { HomeBlock } from '../models';
import RibbonSkeleton from './RibbonSkeleton';

type Props = {
  /** Включённые блоки из `Source.homeSections` — известны без запроса к сайту. */
  blocks: Pick<HomeBlock, 'id' | 'title'>[];
};

/** Z1 — скелетон секции: заголовок источника и по ленте на каждый включённый блок, с настоящими
 *  названиями блоков. Держит место секции, пока та не доехала до экрана. */
function HomeSourceSkeleton({ blocks }: Props) {
  return (
    <Stack gap="md">
      <SourceTitleSkeleton />
      <Stack gap="lg">
        {blocks.map((block) => (
          <Stack key={block.id} gap="xs">
            <Text fz="sm" fw={600} lh="tight">
              {block.title}
            </Text>
            <RibbonSkeleton />
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
}

export default HomeSourceSkeleton;

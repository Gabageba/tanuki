import { Group, Stack, Text } from '@mantine/core';
import SourceTitleSkeleton from '@/entities/source/components/SourceTitle/SourceTitleSkeleton';
import type { HomeBlock } from '../models';
import RibbonSkeleton from './RibbonSkeleton';

type Props = {
  /** Включённые блоки из `Source.homeSections` — известны без запроса к сайту. */
  blocks: Pick<HomeBlock, 'id' | 'title'>[];
};

/** Z1 под S2b — вкладки блоков уже настоящие (названия есть в `homeSections`), первая отмечена;
 *  скелетоном — только заголовок источника и одна лента. Переключать до ответа нечего, поэтому
 *  вкладки не нажимаются. */
function HomeSourceTextTabsSkeleton({ blocks }: Props) {
  return (
    <Stack gap="md">
      <SourceTitleSkeleton />
      <Stack gap="sm">
        <Group
          gap="lg"
          wrap="nowrap"
          style={{
            overflow: 'hidden',
            borderBottom: '1px solid var(--mantine-color-default-border)',
          }}
        >
          {blocks.map((block, index) => (
            <Text
              key={block.id}
              fz="sm"
              fw={600}
              c={index === 0 ? undefined : 'dimmed'}
              pb={8}
              mb={-1}
              style={{
                whiteSpace: 'nowrap',
                borderBottom: `2px solid ${index === 0 ? 'var(--mantine-primary-color-filled)' : 'transparent'}`,
              }}
            >
              {block.title}
            </Text>
          ))}
        </Group>
        <RibbonSkeleton />
      </Stack>
    </Stack>
  );
}

export default HomeSourceTextTabsSkeleton;

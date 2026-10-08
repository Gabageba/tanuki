import { Box, Card, Divider, Group, SimpleGrid, Skeleton, Stack } from '@mantine/core';
import SourceTitleSkeleton from '@/entities/source/components/SourceTitle/SourceTitleSkeleton';
import TextSkeleton from '@/shared/ui/TextSkeleton';

/** Типов контента и источников в каждом обычно столько — заглушки повторяют этот расклад. */
const SKELETON_GROUPS = 2;
const SKELETON_CARDS = 6;

/** Загрузка /sources: те же группы по типу контента и сетка карточек, содержимое — плашками. */
function SourcesListSkeleton() {
  return (
    <Stack gap="lg">
      {Array.from({ length: SKELETON_GROUPS }, (_, group) => (
        <Box key={group}>
          <Divider label={<TextSkeleton fz={12} w={80} />} labelPosition="left" mb="xs" />
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
            {Array.from({ length: SKELETON_CARDS }, (_, index) => (
              <Card key={index} withBorder py={6}>
                <Group gap="xs" wrap="nowrap">
                  <SourceTitleSkeleton />
                  <Stack gap={8} align="flex-end" flex="none">
                    <TextSkeleton lh="tight" w={48} />
                    <Skeleton h={20} w={64} radius="sm" visibleFrom="xxs" />
                  </Stack>
                </Group>
              </Card>
            ))}
          </SimpleGrid>
        </Box>
      ))}
    </Stack>
  );
}

export default SourcesListSkeleton;

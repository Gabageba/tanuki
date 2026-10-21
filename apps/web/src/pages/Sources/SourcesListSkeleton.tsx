import { Box, Divider, SimpleGrid, Stack } from '@mantine/core';
import SourceCardSkeleton from '@/entities/source/components/SourceCard/SourceCardSkeleton';
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
              <SourceCardSkeleton key={index} />
            ))}
          </SimpleGrid>
        </Box>
      ))}
    </Stack>
  );
}

export default SourcesListSkeleton;

import { Group, Paper, SimpleGrid, Skeleton, Stack } from '@mantine/core';
import TextSkeleton from '@/shared/ui/TextSkeleton';

/** Четыре счётчика сверху и карточки-графики под ними: главы, время, теги, источники, закладки. */
const META_CARDS = 4;
const CARDS = 5;

/** Загрузка статистики: та же сетка счётчиков и карточек, содержимое — плашками. */
function ProfileStatisticsSkeleton() {
  return (
    <Stack mt="lg">
      <SimpleGrid cols={{ base: 1, xs: 2, md: 4 }}>
        {Array.from({ length: META_CARDS }, (_, index) => (
          <Paper key={index} withBorder radius="md" p="md">
            <Stack gap="sm">
              <TextSkeleton fz={12} lh="tight" w={100} />
              <Stack gap={8}>
                <Group gap={8} align="baseline" wrap="nowrap">
                  <Skeleton h={38} w={64} />
                  <TextSkeleton lh="tight" w={48} />
                </Group>
                <TextSkeleton fz="sm" lh="tight" w="70%" />
              </Stack>
            </Stack>
          </Paper>
        ))}
      </SimpleGrid>
      <SimpleGrid cols={{ base: 1, md: 2 }}>
        {Array.from({ length: CARDS }, (_, index) => (
          <Paper key={index} withBorder radius="md" p="lg">
            <Stack gap="lg">
              <TextSkeleton fz={16} w={140} />
              <Skeleton h={200} />
            </Stack>
          </Paper>
        ))}
      </SimpleGrid>
    </Stack>
  );
}

export default ProfileStatisticsSkeleton;

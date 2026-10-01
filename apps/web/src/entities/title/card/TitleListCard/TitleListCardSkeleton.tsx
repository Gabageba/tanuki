import { Card, Group, Skeleton, Stack } from '@mantine/core';
import TextSkeleton from '@/shared/ui/TextSkeleton';
import TitleCardTagsSkeleton from '../TitleCardTags/TitleCardTagsSkeleton';

function TitleListCardSkeleton() {
  return (
    <Card withBorder p={0}>
      <Group align="start" gap={0}>
        <Skeleton h={160} w={120} />
        <Stack p="sm" h="100%" flex={1} miw={0} gap={8}>
          <Stack gap={8} flex={1}>
            <TextSkeleton fz={12} lh="tight" w="40%" />
            <TextSkeleton fz={{ base: 16, xs: 18 }} lh="tight" w="80%" />
            <TextSkeleton lh="tight" lines={4} />
          </Stack>
          <Group gap={8}>
            <TitleCardTagsSkeleton />
            <Skeleton w={54} h={25} />
          </Group>
        </Stack>
      </Group>
    </Card>
  );
}

export default TitleListCardSkeleton;

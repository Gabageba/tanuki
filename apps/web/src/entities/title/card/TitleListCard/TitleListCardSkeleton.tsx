import { Card, Group, Skeleton, Stack } from '@mantine/core';
import TextSkeleton from '@/shared/ui/TextSkeleton';
import TitleCardTagsSkeleton from '../TitleCardTags/TitleCardTagsSkeleton';

function TitleListCardSkeleton() {
  return (
    <Card withBorder p={0}>
      <Group align="stretch" wrap="nowrap" gap={0}>
        {/* Как обложка строки: 120 в ширину, 3:4 — минимум, тянется за текстом. */}
        <Skeleton w={120} h="auto" mih={160} flex="none" />
        <Stack p="sm" flex={1} miw={0} gap={8}>
          <Stack gap={8} flex={1}>
            <TextSkeleton fz={12} lh="tight" w="40%" />
            <TextSkeleton fz="sm" lh="tight" w="80%" />
            <TextSkeleton lh="tight" lines={4} />
          </Stack>
          <Group gap={8} wrap="nowrap">
            <TitleCardTagsSkeleton />
            <TextSkeleton lh="tight" w={48} />
          </Group>
        </Stack>
      </Group>
    </Card>
  );
}

export default TitleListCardSkeleton;

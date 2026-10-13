import { AspectRatio, Group, Skeleton, Stack } from '@mantine/core';
import TextSkeleton from '@/shared/ui/TextSkeleton';
import { NEW_CHAPTER_COVER_WIDTH } from '../models';

function NewChapterRowSkeleton() {
  return (
    <Group gap="sm" wrap="nowrap">
      <AspectRatio ratio={3 / 4} w={NEW_CHAPTER_COVER_WIDTH} flex="none">
        <Skeleton radius="sm" />
      </AspectRatio>
      <Stack gap={2} miw={0} flex={1}>
        <TextSkeleton fz="sm" lh="tight" w="70%" />
        <Group gap={6} wrap="nowrap">
          <Skeleton circle h={14} />
          <TextSkeleton fz="xs" w="40%" />
        </Group>
      </Stack>
      <TextSkeleton fz="sm" w={48} flex="none" />
    </Group>
  );
}

export default NewChapterRowSkeleton;

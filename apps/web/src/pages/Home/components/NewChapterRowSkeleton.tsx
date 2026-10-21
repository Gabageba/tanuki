import { Card, Group, Skeleton, Stack } from '@mantine/core';
import TextSkeleton from '@/shared/ui/TextSkeleton';
import { NEW_CHAPTER_COVER_WIDTH } from '../models';

/** Повторяет `NewChapterRow`: карточку списка с обложкой, источником, названием и счётчиком. */
function NewChapterRowSkeleton() {
  return (
    <Card withBorder p={0}>
      <Group align="stretch" wrap="nowrap" gap={0}>
        <Skeleton w={NEW_CHAPTER_COVER_WIDTH} style={{ aspectRatio: '3 / 4' }} flex="none" />
        <Stack p="sm" flex={1} miw={0} gap={8}>
          <Stack gap={8} flex={1}>
            <Group gap={6} wrap="nowrap">
              <Skeleton circle h={14} />
              <TextSkeleton fz="xs" lh="tight" w="40%" />
            </Group>
            <TextSkeleton fz="sm" lh="tight" w="80%" />
          </Stack>
          <TextSkeleton fz="sm" lh="tight" w={56} />
        </Stack>
      </Group>
    </Card>
  );
}

export default NewChapterRowSkeleton;

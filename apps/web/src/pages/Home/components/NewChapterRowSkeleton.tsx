import { Group, Skeleton } from '@mantine/core';
import { VIEW_MODE } from '@tanuki/contracts';
import TextSkeleton from '@/shared/ui/TextSkeleton';
import TitleCardSkeleton from '@/entities/title/card/TitleCard/TitleCardSkeleton';
import { TITLE_CARD_LIST_SIZE } from '@/entities/title/card/TitleCard/models';

/** Повторяет `NewChapterRow`: карточку списка с обложкой, источником, названием и счётчиком. */
function NewChapterRowSkeleton() {
  return (
    <TitleCardSkeleton
      viewMode={VIEW_MODE.LIST}
      listSize={TITLE_CARD_LIST_SIZE.COMPACT}
      meta={
        <Group gap={6} wrap="nowrap">
          <Skeleton w={14} h={14} radius="sm" />
          <TextSkeleton fz="xs" lh="tight" w="40%" />
        </Group>
      }
      footer={<TextSkeleton fz="sm" lh="tight" w={56} />}
    />
  );
}

export default NewChapterRowSkeleton;

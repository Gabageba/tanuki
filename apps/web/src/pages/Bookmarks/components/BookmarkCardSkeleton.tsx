import { Group, Skeleton } from '@mantine/core';
import type { ViewMode } from '@tanuki/contracts';
import TextSkeleton from '@/shared/ui/TextSkeleton';
import TitleCardSkeleton from '@/entities/title/card/TitleCard/TitleCardSkeleton';
import { TITLE_CARD_LIST_SIZE } from '@/entities/title/card/TitleCard/models';

type Props = {
  viewMode: ViewMode;
};

/** Та же компактная обложка, источник, прогресс, меню и название, что у BookmarkCard. */
function BookmarkCardSkeleton({ viewMode }: Props) {
  return (
    <TitleCardSkeleton
      viewMode={viewMode}
      listSize={TITLE_CARD_LIST_SIZE.COMPACT}
      withActions
      meta={
        <Group gap={6} wrap="nowrap">
          <Skeleton w={20} h={20} radius="sm" />
          <TextSkeleton fz="xs" lh="tight" w="60%" />
        </Group>
      }
      footer={<TextSkeleton fz="xs" lh="tight" w={60} />}
    />
  );
}

export default BookmarkCardSkeleton;

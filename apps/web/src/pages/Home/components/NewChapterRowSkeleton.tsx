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
      meta={<TextSkeleton fz="xs" lh="tight" w="40%" />}
      footer={<TextSkeleton fz="xs" lh="tight" w="80%" />}
    />
  );
}

export default NewChapterRowSkeleton;

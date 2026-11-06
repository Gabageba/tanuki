import { Center } from '@mantine/core';
import TextSkeleton from '@/shared/ui/TextSkeleton';
import { TITLE_CARD_ACTION_SIZE } from '../models';

/** Сохраняет место под кнопку, а видимая плашка занимает высоту текста. */
function TitleCardActionsSkeleton() {
  return (
    <Center
      data-card-actions-skeleton
      w={TITLE_CARD_ACTION_SIZE}
      h={TITLE_CARD_ACTION_SIZE}
      fz="xs"
      lh="tight"
    >
      <TextSkeleton fz="xs" lh="tight" w="100%" />
    </Center>
  );
}

export default TitleCardActionsSkeleton;

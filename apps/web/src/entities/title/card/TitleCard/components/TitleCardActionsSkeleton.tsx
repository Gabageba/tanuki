import { Center } from '@mantine/core';
import TextSkeleton from '@/shared/ui/TextSkeleton';
import { TITLE_CARD_ACTION_SIZE } from '../models';

/** Как и кнопка, занимает в раскладке только высоту мета-текста. */
function TitleCardActionsSkeleton() {
  return (
    <Center data-card-actions-skeleton w={TITLE_CARD_ACTION_SIZE} h="1lh" fz="xs" lh="tight">
      <TextSkeleton fz="xs" lh="tight" w="100%" />
    </Center>
  );
}

export default TitleCardActionsSkeleton;

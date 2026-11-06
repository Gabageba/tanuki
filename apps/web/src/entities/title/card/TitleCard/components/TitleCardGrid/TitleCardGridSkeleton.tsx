import { AspectRatio, Card, Skeleton, Stack } from '@mantine/core';
import TextSkeleton from '@/shared/ui/TextSkeleton';
import { VIEW_MODE } from '@tanuki/contracts';
import TitleCardMetaRow from '../TitleCardMetaRow';
import type { TitleCardSkeletonContent } from '../../models';
import styles from '../../TitleCard.module.scss';

type Props = TitleCardSkeletonContent;

function TitleCardGridSkeleton({ meta, actions }: Props) {
  return (
    <Card
      data-title-card
      data-view-mode={VIEW_MODE.GRID}
      className={styles.card}
      p={0}
      bg="transparent"
      bdrs="var(--mantine-radius-md) var(--mantine-radius-md) 0 0"
      inert
      aria-hidden
    >
      <Stack gap={8}>
        <AspectRatio data-card-cover ratio={3 / 4}>
          <Skeleton w="100%" h="100%" radius="md" />
        </AspectRatio>
        <Stack className={styles.heading} gap={4}>
          <TitleCardMetaRow meta={meta} actions={actions} />
          <TextSkeleton lh="tight" lines={2} />
        </Stack>
      </Stack>
    </Card>
  );
}

export default TitleCardGridSkeleton;

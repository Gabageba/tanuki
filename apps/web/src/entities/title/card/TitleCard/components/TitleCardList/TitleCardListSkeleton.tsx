import { Box, Card, Group, Skeleton, Stack } from '@mantine/core';
import TextSkeleton from '@/shared/ui/TextSkeleton';
import useTitleCardLayout from '../../hooks/useTitleCardLayout';
import { VIEW_MODE } from '@tanuki/contracts';
import TitleCardMetaRow from '../TitleCardMetaRow';
import { getTitleCardCoverWidth } from '../../lib';
import type { TitleCardSkeletonContent } from '../../models';
import styles from '../../TitleCard.module.scss';

type Props = TitleCardSkeletonContent;

function TitleCardListSkeleton({ meta, actions, footer, withDescription }: Props) {
  const { listSize } = useTitleCardLayout();
  const coverWidth = getTitleCardCoverWidth(listSize);

  return (
    <Card
      data-title-card
      data-view-mode={VIEW_MODE.LIST}
      className={styles.card}
      p={0}
      withBorder
      inert
      aria-hidden
    >
      <Group align="stretch" wrap="nowrap" gap={0}>
        <Skeleton
          data-card-cover
          w={coverWidth}
          h="auto"
          mih={(coverWidth * 4) / 3}
          flex="none"
          radius="md"
        />
        <Stack p="sm" flex={1} miw={0} gap={8}>
          <Stack className={styles.heading} gap={8} flex={1}>
            <TitleCardMetaRow meta={meta} actions={actions} />
            <TextSkeleton lh="tight" lines={withDescription ? 1 : 2} />
            {withDescription && <TextSkeleton lh="tight" lines={4} />}
          </Stack>
          <Box data-card-footer className={styles.footer}>
            {footer}
          </Box>
        </Stack>
      </Group>
    </Card>
  );
}

export default TitleCardListSkeleton;

import type { ReactNode } from 'react';
import { Box, Group } from '@mantine/core';
import { CONTENT_RATING, type ContentRating } from '@tanuki/contracts';
import TitleAdultTag from '@/entities/title/markers/TitleAdultTag';
import { TITLE_TAG_HEIGHT } from '@/entities/title/markers/models';
import type { TitleCardViewSlots } from '../models';
import styles from '../TitleCard.module.scss';

type Props = Pick<TitleCardViewSlots, 'meta' | 'actions'> & {
  contentRating?: ContentRating;
  markers?: ReactNode;
};

function TitleCardMetaRow({ meta, actions, markers, contentRating = CONTENT_RATING.SAFE }: Props) {
  return (
    <Group
      data-card-meta
      className={styles.metaRow}
      gap={6}
      mih={TITLE_TAG_HEIGHT}
      wrap="nowrap"
      align="center"
    >
      <Box data-card-meta-content className={styles.meta} miw={0} flex="1 1 auto">
        {meta === 0 ? null : meta}
      </Box>
      <Group
        className={styles.actions}
        pos="relative"
        ml="auto"
        flex="none"
        gap={8}
        wrap="nowrap"
        fz="sm"
        lh="tight"
      >
        {markers}
        <TitleAdultTag contentRating={contentRating} />
        {actions}
      </Group>
    </Group>
  );
}

export default TitleCardMetaRow;

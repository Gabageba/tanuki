import { Box, Card, Skeleton, Stack } from '@mantine/core';
import { VIEW_MODE } from '@tanuki/contracts';
import TextSkeleton from '@/shared/ui/TextSkeleton';
import type { TitleCardSkeletonContent } from '../../models';
import TitleCardMetaRow from '../TitleCardMetaRow';
import { TITLE_TAG_HEIGHT } from '@/entities/title/markers/models';
import styles from '../../TitleCard.module.scss';

type Props = TitleCardSkeletonContent;

function TitleCardCoverlessSkeleton({ meta, withDescription, footer, actions }: Props) {
  return (
    <Card p="sm" withBorder inert data-title-card data-view-mode={VIEW_MODE.COVERLESS}>
      <Stack gap={8} flex={1}>
        <Stack className={styles.heading} gap={8}>
          <TitleCardMetaRow
            meta={meta}
            actions={
              <>
                <Skeleton h={TITLE_TAG_HEIGHT} w={34} />
                {actions}
              </>
            }
            markers={<Skeleton h={TITLE_TAG_HEIGHT} w={TITLE_TAG_HEIGHT} />}
          />
          <TextSkeleton lh="tight" lines={2} />
        </Stack>
        {withDescription && <TextSkeleton lh="tight" lines={2} />}
        <Box className={styles.footer} data-card-footer mt="auto">
          {footer}
        </Box>
      </Stack>
    </Card>
  );
}

export default TitleCardCoverlessSkeleton;

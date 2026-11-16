import { Box, Group } from '@mantine/core';
import SourceTitleCard from '@/entities/source/components/SourceTitleCard/SourceTitleCard';
import { REVIEW_ACTION_LAYOUT, type ReviewActionLayout } from '../models';
import { MATCHES } from '../mocks';
import type useComparison from '../hooks/useComparison';
import QuickVerdictMenu from './QuickVerdictMenu';
import ReviewIconActions from './ReviewIconActions';
import ReviewFixedActionsCard from './ReviewFixedActionsCard';
import styles from './QuickCoverCard.module.scss';

type Props = {
  layout: ReviewActionLayout;
  checking: boolean;
  index: number;
  review: ReturnType<typeof useComparison>;
};

function ReviewCandidateCard({ layout, checking, index, review }: Props) {
  const card = <SourceTitleCard title={MATCHES[index]!.title} showSource />;

  if (!checking) return card;

  switch (layout) {
    case REVIEW_ACTION_LAYOUT.SIDE_OVERLAY:
    case REVIEW_ACTION_LAYOUT.SIDE_INSET:
    case REVIEW_ACTION_LAYOUT.SIDE_PAIR:
    case REVIEW_ACTION_LAYOUT.STACK_OVERLAY:
    case REVIEW_ACTION_LAYOUT.STACK_CROP:
    case REVIEW_ACTION_LAYOUT.STACK_FIT:
      return <ReviewFixedActionsCard layout={layout} index={index} review={review} />;
    case REVIEW_ACTION_LAYOUT.ORIGINAL:
    case REVIEW_ACTION_LAYOUT.SEPARATE:
    case REVIEW_ACTION_LAYOUT.STACKED:
    case REVIEW_ACTION_LAYOUT.EQUAL:
      return card;
    case REVIEW_ACTION_LAYOUT.CORNERS:
      return (
        <Box pos="relative">
          {card}
          <Box pos="absolute" top={8} left={8} right={8} className={styles.coverActions}>
            <ReviewIconActions review={review} index={index} />
          </Box>
        </Box>
      );
    case REVIEW_ACTION_LAYOUT.MENU:
      return (
        <Box pos="relative">
          {card}
          <Box pos="absolute" top={8} right={8} className={styles.controls} style={{ zIndex: 2 }}>
            <QuickVerdictMenu review={review} index={index} iconOnly />
          </Box>
        </Box>
      );
    case REVIEW_ACTION_LAYOUT.SIDE:
      return (
        <Group align="flex-start" gap={8} wrap="nowrap">
          <Box w={170} miw={170}>
            {card}
          </Box>
          <ReviewIconActions review={review} index={index} vertical />
        </Group>
      );
  }
}

export default ReviewCandidateCard;

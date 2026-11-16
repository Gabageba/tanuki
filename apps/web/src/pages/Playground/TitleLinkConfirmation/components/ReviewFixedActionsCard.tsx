import { Box } from '@mantine/core';
import SourceTitleCard from '@/entities/source/components/SourceTitleCard/SourceTitleCard';
import { REVIEW_ACTION_LAYOUT, type ReviewActionLayout } from '../models';
import { MATCHES } from '../mocks';
import type useComparison from '../hooks/useComparison';
import ReviewDecisionButtons from './ReviewDecisionButtons';
import ReviewIconActions from './ReviewIconActions';
import coverStyles from './QuickCoverCard.module.scss';
import styles from './ReviewFixedActionsCard.module.scss';

type Props = {
  layout: ReviewActionLayout;
  index: number;
  review: ReturnType<typeof useComparison>;
};

function ReviewFixedActionsCard({ layout, index, review }: Props) {
  const getCoverClass = () => {
    switch (layout) {
      case REVIEW_ACTION_LAYOUT.SIDE_INSET:
        return styles.sideInset;
      case REVIEW_ACTION_LAYOUT.STACK_CROP:
        return styles.stackCrop;
      case REVIEW_ACTION_LAYOUT.STACK_FIT:
        return styles.stackFit;
      case REVIEW_ACTION_LAYOUT.SIDE_OVERLAY:
      case REVIEW_ACTION_LAYOUT.SIDE_PAIR:
      case REVIEW_ACTION_LAYOUT.STACK_OVERLAY:
      case REVIEW_ACTION_LAYOUT.ORIGINAL:
      case REVIEW_ACTION_LAYOUT.SEPARATE:
      case REVIEW_ACTION_LAYOUT.STACKED:
      case REVIEW_ACTION_LAYOUT.EQUAL:
      case REVIEW_ACTION_LAYOUT.CORNERS:
      case REVIEW_ACTION_LAYOUT.MENU:
      case REVIEW_ACTION_LAYOUT.SIDE:
        return undefined;
    }
  };
  const getActions = () => {
    switch (layout) {
      case REVIEW_ACTION_LAYOUT.SIDE_OVERLAY:
        return (
          <Box pos="absolute" top="calc(50% - 40px)" right={8}>
            <ReviewIconActions review={review} index={index} vertical />
          </Box>
        );
      case REVIEW_ACTION_LAYOUT.SIDE_INSET:
        return (
          <Box pos="absolute" top={0} right={0}>
            <ReviewIconActions review={review} index={index} vertical />
          </Box>
        );
      case REVIEW_ACTION_LAYOUT.SIDE_PAIR:
        return (
          <Box pos="absolute" top={8} right={8} w={80}>
            <ReviewIconActions review={review} index={index} />
          </Box>
        );
      case REVIEW_ACTION_LAYOUT.STACK_OVERLAY:
        return (
          <Box pos="absolute" bottom={40} left={8} right={8} className={coverStyles.controls}>
            <ReviewDecisionButtons
              review={review}
              index={index}
              layout={REVIEW_ACTION_LAYOUT.STACKED}
              fullWidth
            />
          </Box>
        );
      case REVIEW_ACTION_LAYOUT.STACK_CROP:
      case REVIEW_ACTION_LAYOUT.STACK_FIT:
        return (
          <Box pos="absolute" bottom={0} left={0} right={0} className={coverStyles.controls}>
            <ReviewDecisionButtons
              review={review}
              index={index}
              layout={REVIEW_ACTION_LAYOUT.STACKED}
              fullWidth
            />
          </Box>
        );
      case REVIEW_ACTION_LAYOUT.ORIGINAL:
      case REVIEW_ACTION_LAYOUT.SEPARATE:
      case REVIEW_ACTION_LAYOUT.STACKED:
      case REVIEW_ACTION_LAYOUT.EQUAL:
      case REVIEW_ACTION_LAYOUT.CORNERS:
      case REVIEW_ACTION_LAYOUT.MENU:
      case REVIEW_ACTION_LAYOUT.SIDE:
        return null;
    }
  };

  return (
    <Box pos="relative" className={getCoverClass()}>
      <SourceTitleCard title={MATCHES[index]!.title} showSource />
      <Box
        pos="absolute"
        top={0}
        w="100%"
        style={{ aspectRatio: '3 / 4' }}
        className={coverStyles.coverActions}
      >
        {getActions()}
      </Box>
    </Box>
  );
}

export default ReviewFixedActionsCard;

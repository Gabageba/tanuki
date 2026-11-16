import { Button, Group, Stack, type ButtonProps } from '@mantine/core';
import { ThumbsDownIcon, ThumbsUpIcon } from '@phosphor-icons/react';
import { TITLE_LINK_VERDICT } from '@tanuki/contracts';
import { REVIEW_ACTION_LAYOUT, type ReviewActionLayout } from '../models';
import { MATCHES } from '../mocks';
import type useComparison from '../hooks/useComparison';
import QuickDecisionButtons from './QuickDecisionButtons';

type Props = {
  review: ReturnType<typeof useComparison>;
  index: number;
  layout: ReviewActionLayout;
  fullWidth?: boolean;
};

function ReviewDecisionButtons({ review, index, layout, fullWidth = false }: Props) {
  const isPending = review.pendingVerdict !== null;
  const isSaving = review.pendingIndex === index;
  const verdict = review.verdicts[MATCHES[index]!.title.id];

  const getConfirmVariant = (): ButtonProps['variant'] => {
    switch (layout) {
      case REVIEW_ACTION_LAYOUT.ORIGINAL:
      case REVIEW_ACTION_LAYOUT.SEPARATE:
      case REVIEW_ACTION_LAYOUT.STACKED:
        return 'filled';
      case REVIEW_ACTION_LAYOUT.EQUAL:
      case REVIEW_ACTION_LAYOUT.CORNERS:
      case REVIEW_ACTION_LAYOUT.MENU:
      case REVIEW_ACTION_LAYOUT.SIDE:
      case REVIEW_ACTION_LAYOUT.SIDE_OVERLAY:
      case REVIEW_ACTION_LAYOUT.SIDE_INSET:
      case REVIEW_ACTION_LAYOUT.SIDE_PAIR:
      case REVIEW_ACTION_LAYOUT.STACK_OVERLAY:
      case REVIEW_ACTION_LAYOUT.STACK_CROP:
      case REVIEW_ACTION_LAYOUT.STACK_FIT:
        return 'default';
    }
  };
  const buttons = (
    <>
      <Button
        size="xs"
        px={6}
        variant={getConfirmVariant()}
        leftSection={<ThumbsUpIcon size={14} />}
        loading={isSaving && review.pendingVerdict === TITLE_LINK_VERDICT.CONFIRMED}
        disabled={isPending || verdict === TITLE_LINK_VERDICT.CONFIRMED}
        onClick={() => review.save(TITLE_LINK_VERDICT.CONFIRMED, index)}
      >
        Это он
      </Button>
      <Button
        size="xs"
        px={6}
        variant="default"
        leftSection={<ThumbsDownIcon size={14} />}
        loading={isSaving && review.pendingVerdict === TITLE_LINK_VERDICT.REJECTED}
        disabled={isPending || verdict === TITLE_LINK_VERDICT.REJECTED}
        onClick={() => review.save(TITLE_LINK_VERDICT.REJECTED, index)}
      >
        Не он
      </Button>
    </>
  );

  switch (layout) {
    case REVIEW_ACTION_LAYOUT.ORIGINAL:
      return <QuickDecisionButtons review={review} index={index} />;
    case REVIEW_ACTION_LAYOUT.CORNERS:
    case REVIEW_ACTION_LAYOUT.MENU:
    case REVIEW_ACTION_LAYOUT.SIDE:
    case REVIEW_ACTION_LAYOUT.SIDE_OVERLAY:
    case REVIEW_ACTION_LAYOUT.SIDE_INSET:
    case REVIEW_ACTION_LAYOUT.SIDE_PAIR:
    case REVIEW_ACTION_LAYOUT.STACK_OVERLAY:
    case REVIEW_ACTION_LAYOUT.STACK_CROP:
    case REVIEW_ACTION_LAYOUT.STACK_FIT:
      return null;
    case REVIEW_ACTION_LAYOUT.SEPARATE:
    case REVIEW_ACTION_LAYOUT.EQUAL:
      return (
        <Group grow wrap="nowrap" gap={8} w={fullWidth ? '100%' : 170}>
          {buttons}
        </Group>
      );
    case REVIEW_ACTION_LAYOUT.STACKED:
      return (
        <Stack gap={8} w={fullWidth ? '100%' : 170}>
          {buttons}
        </Stack>
      );
  }
}

export default ReviewDecisionButtons;

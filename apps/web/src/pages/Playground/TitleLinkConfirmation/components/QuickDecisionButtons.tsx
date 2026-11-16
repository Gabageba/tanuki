import { Button } from '@mantine/core';
import { ThumbsDownIcon, ThumbsUpIcon } from '@phosphor-icons/react';
import { TITLE_LINK_VERDICT } from '@tanuki/contracts';
import { MATCHES } from '../mocks';
import type useComparison from '../hooks/useComparison';

type Props = {
  review: ReturnType<typeof useComparison>;
  index: number;
};

function QuickDecisionButtons({ review, index }: Props) {
  const isPending = review.pendingVerdict !== null;
  const isSaving = review.pendingIndex === index;
  const verdict = review.verdicts[MATCHES[index]!.title.id];

  return (
    <Button.Group w={170} maw="100%">
      <Button
        size="xs"
        px="xs"
        w="50%"
        leftSection={<ThumbsUpIcon size={14} />}
        loading={isSaving && review.pendingVerdict === TITLE_LINK_VERDICT.CONFIRMED}
        disabled={isPending || verdict === TITLE_LINK_VERDICT.CONFIRMED}
        onClick={() => review.save(TITLE_LINK_VERDICT.CONFIRMED, index)}
      >
        Это он
      </Button>
      <Button
        size="xs"
        px="xs"
        w="50%"
        variant="default"
        leftSection={<ThumbsDownIcon size={14} />}
        loading={isSaving && review.pendingVerdict === TITLE_LINK_VERDICT.REJECTED}
        disabled={isPending || verdict === TITLE_LINK_VERDICT.REJECTED}
        onClick={() => review.save(TITLE_LINK_VERDICT.REJECTED, index)}
      >
        Не он
      </Button>
    </Button.Group>
  );
}

export default QuickDecisionButtons;

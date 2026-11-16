import { ActionIcon, Flex, Tooltip } from '@mantine/core';
import { ThumbsDownIcon, ThumbsUpIcon } from '@phosphor-icons/react';
import { TITLE_LINK_VERDICT } from '@tanuki/contracts';
import { MATCHES } from '../mocks';
import type useComparison from '../hooks/useComparison';

type Props = {
  review: ReturnType<typeof useComparison>;
  index: number;
  vertical?: boolean;
};

function ReviewIconActions({ review, index, vertical = false }: Props) {
  const match = MATCHES[index]!;
  const isPending = review.pendingVerdict !== null;
  const isSaving = review.pendingIndex === index;
  const verdict = review.verdicts[match.title.id];

  return (
    <Flex direction={vertical ? 'column' : 'row'} gap={8} justify="space-between">
      <Tooltip label="Это он" withArrow>
        <ActionIcon
          size={36}
          variant="default"
          aria-label={`Это он — «${match.title.name}»`}
          loading={isSaving && review.pendingVerdict === TITLE_LINK_VERDICT.CONFIRMED}
          disabled={isPending || verdict === TITLE_LINK_VERDICT.CONFIRMED}
          onClick={() => review.save(TITLE_LINK_VERDICT.CONFIRMED, index)}
          style={{ pointerEvents: 'auto' }}
        >
          <ThumbsUpIcon size={20} />
        </ActionIcon>
      </Tooltip>
      <Tooltip label="Не он" withArrow>
        <ActionIcon
          size={36}
          variant="default"
          aria-label={`Не он — «${match.title.name}»`}
          loading={isSaving && review.pendingVerdict === TITLE_LINK_VERDICT.REJECTED}
          disabled={isPending || verdict === TITLE_LINK_VERDICT.REJECTED}
          onClick={() => review.save(TITLE_LINK_VERDICT.REJECTED, index)}
          style={{ pointerEvents: 'auto' }}
        >
          <ThumbsDownIcon size={20} />
        </ActionIcon>
      </Tooltip>
    </Flex>
  );
}

export default ReviewIconActions;

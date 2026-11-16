import { Button } from '@mantine/core';
import { CheckCircleIcon, CircleIcon } from '@phosphor-icons/react';
import { MATCHES } from '../mocks';
import type useComparison from '../hooks/useComparison';

type Props = { review: ReturnType<typeof useComparison>; index: number };

function QuickSelectCandidate({ review, index }: Props) {
  const selected = review.opened && review.selectedIndex === index;

  return (
    <Button
      size="xs"
      fullWidth
      variant={selected ? 'light' : 'default'}
      leftSection={selected ? <CheckCircleIcon /> : <CircleIcon />}
      aria-label={`Выбрать кандидата «${MATCHES[index]!.title.name}»`}
      aria-pressed={selected}
      disabled={review.pendingVerdict !== null}
      onClick={() => review.select(index)}
    >
      {selected ? 'Выбран' : 'Выбрать'}
    </Button>
  );
}

export default QuickSelectCandidate;

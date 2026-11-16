import { useId } from 'react';
import { Button, Collapse, Stack } from '@mantine/core';
import { CaretDownIcon, CaretUpIcon, CheckSquareIcon } from '@phosphor-icons/react';
import { MATCHES } from '../mocks';
import type useComparison from '../hooks/useComparison';
import QuickDecisionButtons from './QuickDecisionButtons';

type Props = { review: ReturnType<typeof useComparison>; index: number };

function QuickExpandableActions({ review, index }: Props) {
  const id = useId();
  const opened = review.opened && review.selectedIndex === index;

  return (
    <Stack gap={8}>
      <Button
        size="xs"
        variant="default"
        fullWidth
        leftSection={<CheckSquareIcon size={14} />}
        rightSection={opened ? <CaretUpIcon size={14} /> : <CaretDownIcon size={14} />}
        aria-label={`Проверить связь «${MATCHES[index]!.title.name}»`}
        aria-expanded={opened}
        aria-controls={id}
        disabled={review.pendingVerdict !== null}
        onClick={() => (opened ? review.close() : review.select(index))}
      >
        Проверить связь
      </Button>
      <Collapse expanded={opened} id={id}>
        <QuickDecisionButtons review={review} index={index} />
      </Collapse>
    </Stack>
  );
}

export default QuickExpandableActions;

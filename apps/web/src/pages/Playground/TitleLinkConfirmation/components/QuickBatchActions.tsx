import { Button, Flex, Group, Text } from '@mantine/core';
import { SelectionSlashIcon, ThumbsDownIcon, ThumbsUpIcon } from '@phosphor-icons/react';
import { TITLE_LINK_VERDICT } from '@tanuki/contracts';
import type useComparison from '../hooks/useComparison';

type Props = {
  review: ReturnType<typeof useComparison>;
  selectedIndexes: number[];
  clearSelection: () => void;
  isPhone: boolean;
  confirmLabel?: string;
  rejectLabel?: string;
  withClearSelection?: boolean;
  isEmpty?: boolean;
  colored?: boolean;
  split?: boolean;
  stackOnPhone?: boolean;
};

function QuickBatchActions({
  review,
  selectedIndexes,
  clearSelection,
  isPhone,
  confirmLabel = 'Подтвердить выбранные',
  rejectLabel = 'Отклонить выбранные',
  withClearSelection = false,
  isEmpty = false,
  colored = false,
  split = false,
  stackOnPhone = false,
}: Props) {
  if (isEmpty) return null;
  const disabled = selectedIndexes.length === 0 || review.pendingVerdict !== null;
  const isSplit = split && !(stackOnPhone && isPhone);

  return (
    <Flex
      data-batch-actions
      gap={8}
      direction={isSplit ? 'row' : 'column'}
      align={isSplit ? 'flex-start' : 'stretch'}
    >
      <Text data-batch-count fz="sm" aria-live="polite" flex="none" pt={isSplit ? 4 : 0}>
        Выбрано: {selectedIndexes.length}
      </Text>
      <Group
        gap="xs"
        data-batch-buttons
        justify={isSplit ? 'flex-end' : 'flex-start'}
        flex={isSplit ? 1 : undefined}
        miw={0}
      >
        <Button
          size="xs"
          color={colored ? 'moss' : undefined}
          w={isPhone ? '100%' : 'auto'}
          leftSection={<ThumbsUpIcon />}
          disabled={disabled}
          loading={review.pendingVerdict === TITLE_LINK_VERDICT.CONFIRMED}
          onClick={() =>
            review.saveMany(TITLE_LINK_VERDICT.CONFIRMED, selectedIndexes, clearSelection)
          }
        >
          {confirmLabel}
        </Button>
        <Button
          size="xs"
          variant={colored ? 'filled' : 'default'}
          color={colored ? 'crimson' : undefined}
          w={isPhone ? '100%' : 'auto'}
          leftSection={<ThumbsDownIcon />}
          disabled={disabled}
          loading={review.pendingVerdict === TITLE_LINK_VERDICT.REJECTED}
          onClick={() =>
            review.saveMany(TITLE_LINK_VERDICT.REJECTED, selectedIndexes, clearSelection)
          }
        >
          {rejectLabel}
        </Button>
        {withClearSelection && (
          <Button
            size="xs"
            variant="default"
            w={isPhone ? '100%' : 'auto'}
            leftSection={<SelectionSlashIcon />}
            disabled={disabled}
            onClick={clearSelection}
          >
            Снять выбор
          </Button>
        )}
      </Group>
    </Flex>
  );
}

export default QuickBatchActions;

import { Button, Group, Text } from '@mantine/core';
import { ArrowCounterClockwiseIcon } from '@phosphor-icons/react';

type Props = {
  message: string;
  /** «Вернуть», «Отменить» — подпись кнопки отмены. */
  actionLabel: string;
  onAction: () => void;
};

/** Тост после обратимого действия без модалки: что произошло и кнопка, которая всё вернёт. */
function UndoToastMessage({ message, actionLabel, onAction }: Props) {
  return (
    <Group justify="space-between" wrap="nowrap" gap="sm">
      <Text fz="sm">{message}</Text>
      <Button
        size="compact-sm"
        variant="subtle"
        flex="none"
        leftSection={<ArrowCounterClockwiseIcon />}
        onClick={onAction}
      >
        {actionLabel}
      </Button>
    </Group>
  );
}

export default UndoToastMessage;
